/**
 * RoomManager - Manages all rooms
 */

import { Logger } from '../../utils/Logger';
import { emulator } from '../../core/Emulator';
import { game } from '../GameEnvironment';
import { Room, RoomData, RoomState } from './Room';
import { RoomLayout } from './RoomLayout';

export class RoomManager {
    private logger = new Logger('RoomManager');
    private rooms: Map<number, Room> = new Map();
    private publicRooms: Map<number, Room> = new Map();
    private layouts: Map<string, RoomLayout> = new Map();

    public async initialize(): Promise<void> {
        await this.loadLayouts();
        await this.loadPublicRooms();
        this.logger.info(`Loaded ${this.layouts.size} room models`);
        this.logger.info(`Loaded ${this.publicRooms.size} public rooms`);
    }

    private async loadLayouts(): Promise<void> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query<{
                name: string;
                door_x: number;
                door_y: number;
                door_dir: number;
                heightmap: string;
            }[]>('SELECT name, door_x, door_y, door_dir, heightmap FROM room_models');

            for (const row of rows) {
                const layout = new RoomLayout(
                    row.name,
                    row.door_x,
                    row.door_y,
                    row.door_dir,
                    row.heightmap
                );
                this.layouts.set(row.name, layout);
            }
        } catch (error) {
            this.logger.error('Failed to load room models:', error);
        }
    }

    public getLayout(name: string): RoomLayout | undefined {
        return this.layouts.get(name);
    }

    private async loadPublicRooms(): Promise<void> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query<RoomRow[]>(
                "SELECT * FROM rooms WHERE is_public = '1' OR is_staff_picked = '1' ORDER BY id ASC"
            );

            for (const row of rows) {
                const room = this.createRoomFromRow(row);
                this.publicRooms.set(room.getId(), room);
                this.rooms.set(room.getId(), room);
            }
        } catch (error) {
            this.logger.error('Failed to load public rooms:', error);
        }
    }

    public async getRoom(id: number): Promise<Room | null> {
        // Check cache
        if (this.rooms.has(id)) {
            return this.rooms.get(id)!;
        }

        // Load from database
        try {
            const db = emulator.getDatabase();
            const row = await db.queryOne<RoomRow>(
                'SELECT * FROM rooms WHERE id = ? LIMIT 1',
                [id]
            );

            if (!row) return null;

            const room = this.createRoomFromRow(row);
            this.rooms.set(room.getId(), room);
            return room;
        } catch (error) {
            this.logger.error(`Failed to load room ${id}:`, error);
            return null;
        }
    }

    public async getRoomsByOwner(ownerId: number): Promise<Room[]> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query<RoomRow[]>(
                'SELECT * FROM rooms WHERE owner_id = ? ORDER BY id ASC',
                [ownerId]
            );

            const rooms: Room[] = [];
            for (const row of rows) {
                let room = this.rooms.get(row.id);
                if (!room) {
                    room = this.createRoomFromRow(row);
                    this.rooms.set(room.getId(), room);
                }
                rooms.push(room);
            }
            return rooms;
        } catch (error) {
            this.logger.error(`Failed to load rooms for owner ${ownerId}:`, error);
            return [];
        }
    }

    public async getPopularRooms(limit: number = 50): Promise<Room[]> {
        try {
            const db = emulator.getDatabase();
            const safeLimit = Math.max(1, Math.min(limit, 100));
            const rows = await db.query<RoomRow[]>(
                `SELECT * FROM rooms WHERE is_public = '0' AND state != 'invisible'
                 ORDER BY users DESC, score DESC LIMIT ${safeLimit}`
            );

            const rooms: Room[] = [];
            for (const row of rows) {
                let room = this.rooms.get(row.id);
                if (!room) {
                    room = this.createRoomFromRow(row);
                    this.rooms.set(room.getId(), room);
                }
                rooms.push(room);
            }
            return rooms;
        } catch (error) {
            this.logger.error('Failed to load popular rooms:', error);
            return [];
        }
    }

    public async searchRooms(query: string, limit: number = 50): Promise<Room[]> {
        try {
            const db = emulator.getDatabase();
            const searchQuery = `%${query}%`;
            const safeLimit = Math.max(1, Math.min(limit, 100));
            const rows = await db.query<RoomRow[]>(
                `SELECT * FROM rooms WHERE (name LIKE ? OR owner_name LIKE ? OR tags LIKE ?)
                 AND state != 'invisible' ORDER BY users DESC LIMIT ${safeLimit}`,
                [searchQuery, searchQuery, searchQuery]
            );

            const rooms: Room[] = [];
            for (const row of rows) {
                let room = this.rooms.get(row.id);
                if (!room) {
                    room = this.createRoomFromRow(row);
                    this.rooms.set(room.getId(), room);
                }
                rooms.push(room);
            }
            return rooms;
        } catch (error) {
            this.logger.error('Failed to search rooms:', error);
            return [];
        }
    }

    public async getRoomsByCategory(categoryId: number, limit: number = 50): Promise<Room[]> {
        try {
            const db = emulator.getDatabase();
            const safeLimit = Math.max(1, Math.min(limit, 100));
            const rows = await db.query<RoomRow[]>(
                `SELECT * FROM rooms WHERE category = ? AND state != 'invisible'
                 ORDER BY users DESC LIMIT ${safeLimit}`,
                [categoryId]
            );

            const rooms: Room[] = [];
            for (const row of rows) {
                let room = this.rooms.get(row.id);
                if (!room) {
                    room = this.createRoomFromRow(row);
                    this.rooms.set(room.getId(), room);
                }
                rooms.push(room);
            }
            return rooms;
        } catch (error) {
            this.logger.error(`Failed to load rooms for category ${categoryId}:`, error);
            return [];
        }
    }

    public async getAllRooms(limit: number = 50): Promise<Room[]> {
        try {
            const db = emulator.getDatabase();
            // LIMIT with parameter can cause issues in some MySQL drivers, use direct value
            const safeLimit = Math.max(1, Math.min(limit, 100)); // Clamp between 1-100
            const rows = await db.query<RoomRow[]>(
                `SELECT * FROM rooms WHERE state != 'invisible'
                 ORDER BY users DESC, score DESC LIMIT ${safeLimit}`
            );

            const rooms: Room[] = [];
            for (const row of rows) {
                let room = this.rooms.get(row.id);
                if (!room) {
                    room = this.createRoomFromRow(row);
                    this.rooms.set(room.getId(), room);
                }
                rooms.push(room);
            }
            return rooms;
        } catch (error) {
            this.logger.error('Failed to load all rooms:', error);
            return [];
        }
    }

    public getPublicRooms(): Room[] {
        return Array.from(this.publicRooms.values());
    }

    private createRoomFromRow(row: RoomRow): Room {
        const data: RoomData = {
            id: row.id,
            ownerId: row.owner_id,
            ownerName: row.owner_name || '',
            name: row.name,
            description: row.description || '',
            state: this.parseState(row.state),
            categoryId: row.category,
            usersNow: row.users || 0,
            usersMax: row.users_max || 25,
            modelName: row.model || 'model_a',
            score: row.score || 0,
            tags: row.tags || '',
            password: row.password || '',
            wallpaper: row.paper_wall || '0.0',
            floor: row.paper_floor || '0.0',
            landscape: row.paper_landscape || '0.0',
            allowPets: row.allow_other_pets === '1',
            allowPetsEat: row.allow_other_pets_eat === '1',
            allowWalkthrough: row.allow_walkthrough === '1',
            hideWall: row.hide_wall === '1',
            wallThickness: row.thickness_wall || 0,
            floorThickness: row.thickness_floor || 0,
            wallHeight: row.wall_height ?? -1,
            muteSettings: row.who_can_mute || 0,
            kickSettings: row.who_can_kick || 0,
            banSettings: row.who_can_ban || 0,
            chatMode: row.chat_mode || 0,
            chatWeight: row.chat_weight || 1,
            chatSpeed: row.chat_speed || 1,
            chatHearingDistance: row.chat_hearing_distance || 50,
            chatProtection: row.chat_protection || 0,
            tradeSettings: row.trade_mode || 0,
            guildId: row.guild_id || 0,
            isPublic: row.is_public === '1',
            hasCustomLayout: row.override_model === '1'
        };

        return new Room(data);
    }

    private parseState(state: string): RoomState {
        switch (state?.toLowerCase()) {
            case 'locked':
            case 'doorbell':
                return RoomState.DOORBELL;
            case 'password':
                return RoomState.PASSWORD;
            case 'invisible':
                return RoomState.INVISIBLE;
            default:
                return RoomState.OPEN;
        }
    }

    public disposeRoom(roomId: number): void {
        this.rooms.delete(roomId);
    }

    /**
     * Load a room and its layout, preparing it for entry
     */
    public async loadRoom(roomId: number): Promise<Room | null> {
        const room = await this.getRoom(roomId);
        if (!room) return null;

        // Load layout if not already loaded
        if (!room.getLayout()) {
            let layout: RoomLayout | undefined;

            // Check if room has custom layout (override_model = '1')
            if (room.hasCustomLayout()) {
                layout = await this.loadCustomLayout(roomId);
                if (layout) {
                    this.logger.debug(`Loaded custom layout for room ${roomId}`);
                }
            }

            // If no custom layout, use standard model
            if (!layout) {
                layout = this.getLayout(room.getModelName());
            }

            if (layout) {
                room.setLayout(layout);
            } else {
                this.logger.warn(`Layout not found for room ${roomId}: ${room.getModelName()}`);
                // Try default model
                const defaultLayout = this.getLayout('model_a');
                if (defaultLayout) {
                    room.setLayout(defaultLayout);
                }
            }
        }

        // Initialize and load items if not already done
        if (!room.getItemManager()) {
            const itemManager = game.getItemManager();
            if (itemManager) {
                room.initializeItemManager(itemManager);
                await room.loadItems();
            }
        }

        room.setLoaded(true);
        return room;
    }

    /**
     * Load custom layout from room_models_custom table
     */
    public async loadCustomLayout(roomId: number): Promise<RoomLayout | undefined> {
        try {
            const db = emulator.getDatabase();
            const row = await db.queryOne<CustomModelRow>(
                'SELECT * FROM room_models_custom WHERE id = ? LIMIT 1',
                [roomId]
            );

            if (!row) {
                this.logger.debug(`No custom layout found for room ${roomId}`);
                return undefined;
            }

            const layout = new RoomLayout(
                row.name || `custom_${roomId}`,
                row.door_x,
                row.door_y,
                row.door_dir,
                row.heightmap
            );

            return layout;
        } catch (error) {
            this.logger.error(`Failed to load custom layout for room ${roomId}:`, error);
            return undefined;
        }
    }

    /**
     * Save custom layout to room_models_custom table
     */
    public async saveCustomLayout(
        roomId: number,
        doorX: number,
        doorY: number,
        doorDir: number,
        heightmap: string
    ): Promise<boolean> {
        try {
            const db = emulator.getDatabase();

            // Insert or update custom layout
            await db.execute(
                `INSERT INTO room_models_custom (id, name, door_x, door_y, door_dir, heightmap)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 door_x = VALUES(door_x),
                 door_y = VALUES(door_y),
                 door_dir = VALUES(door_dir),
                 heightmap = VALUES(heightmap)`,
                [roomId, `custom_${roomId}`, doorX, doorY, doorDir, heightmap]
            );

            // Update rooms table to enable override_model
            await db.execute(
                `UPDATE rooms SET override_model = '1' WHERE id = ?`,
                [roomId]
            );

            // Update cached room if exists
            const room = this.rooms.get(roomId);
            if (room) {
                room.setHasCustomLayout(true);

                // Create and set new layout
                const layout = new RoomLayout(
                    `custom_${roomId}`,
                    doorX,
                    doorY,
                    doorDir,
                    heightmap
                );
                room.setLayout(layout);
            }

            this.logger.info(`Saved custom layout for room ${roomId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to save custom layout for room ${roomId}:`, error);
            return false;
        }
    }

    /**
     * Delete custom layout and revert to standard model
     */
    public async deleteCustomLayout(roomId: number): Promise<boolean> {
        try {
            const db = emulator.getDatabase();

            // Delete from room_models_custom
            await db.execute(
                'DELETE FROM room_models_custom WHERE id = ?',
                [roomId]
            );

            // Update rooms table to disable override_model
            await db.execute(
                `UPDATE rooms SET override_model = '0' WHERE id = ?`,
                [roomId]
            );

            // Update cached room if exists
            const room = this.rooms.get(roomId);
            if (room) {
                room.setHasCustomLayout(false);
                // Clear layout so it reloads from standard models
                room.setLayout(undefined as any);
            }

            this.logger.info(`Deleted custom layout for room ${roomId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete custom layout for room ${roomId}:`, error);
            return false;
        }
    }
}

interface RoomRow {
    id: number;
    owner_id: number;
    owner_name: string;
    name: string;
    description: string;
    state: string;
    category: number;
    users: number;
    users_max: number;
    model: string;
    score: number;
    tags: string;
    password: string;
    paper_wall: string;
    paper_floor: string;
    paper_landscape: string;
    allow_other_pets: string;
    allow_other_pets_eat: string;
    allow_walkthrough: string;
    hide_wall: string;
    thickness_wall: number;
    thickness_floor: number;
    wall_height: number;
    who_can_mute: number;
    who_can_kick: number;
    who_can_ban: number;
    chat_mode: number;
    chat_weight: number;
    chat_speed: number;
    chat_hearing_distance: number;
    chat_protection: number;
    trade_mode: number;
    guild_id: number;
    is_public: string;
    is_staff_picked: string;
    override_model: string;
}

interface CustomModelRow {
    id: number;
    name: string;
    door_x: number;
    door_y: number;
    door_dir: number;
    heightmap: string;
}
