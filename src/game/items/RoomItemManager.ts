/**
 * RoomItemManager - Manages items within a room
 */

import { Logger } from '../../utils/Logger';
import { emulator } from '../../core/Emulator';
import { RoomItem, type RoomItemData } from './RoomItem';
import { WallItem, type WallItemData } from './WallItem';
import type { FurnitureDefinition } from './FurnitureDefinition';
import type { Room } from '../rooms/Room';
import type { ItemManager } from './ItemManager';

interface RoomItemRow {
    id: number;
    room_id: number;
    item_id: number;
    user_id: number;
    username: string;
    x: number;
    y: number;
    z: number;
    rot: number;
    extra_data: string;
    limited_number: number;
    limited_stack: number;
    wall_pos: string;
}

export class RoomItemManager {
    private logger: Logger;
    private room: Room;
    private itemManager: ItemManager;

    private floorItems: Map<number, RoomItem> = new Map();
    private wallItems: Map<number, WallItem> = new Map();

    constructor(room: Room, itemManager: ItemManager) {
        this.room = room;
        this.itemManager = itemManager;
        this.logger = new Logger(`RoomItems:${room.getId()}`);
    }

    public async loadItems(): Promise<void> {
        const db = emulator.getDatabase();

        try {
            const rows = await db.query<RoomItemRow[]>(
                `SELECT i.*, u.username FROM items i
                 LEFT JOIN users u ON i.user_id = u.id
                 WHERE i.room_id = ?`,
                [this.room.getId()]
            );

            for (const row of rows) {
                const definition = this.itemManager.getDefinition(row.item_id);
                if (!definition) {
                    this.logger.debug(`Unknown item definition: ${row.item_id}`);
                    continue;
                }

                if (definition.isWallItem()) {
                    this.loadWallItem(row, definition);
                } else {
                    this.loadFloorItem(row, definition);
                }
            }

            this.logger.debug(`Loaded ${this.floorItems.size} floor items, ${this.wallItems.size} wall items`);
        } catch (error) {
            this.logger.error('Failed to load room items:', error);
        }
    }

    private loadFloorItem(row: RoomItemRow, definition: FurnitureDefinition): void {
        const data: RoomItemData = {
            id: row.id,
            roomId: row.room_id,
            baseItemId: row.item_id,
            ownerId: row.user_id,
            ownerName: row.username || 'Unknown',
            x: row.x,
            y: row.y,
            z: row.z,
            rotation: row.rot,
            extraData: row.extra_data || '0',
            limitedNumber: row.limited_number || 0,
            limitedStack: row.limited_stack || 0
        };

        const item = new RoomItem(data, definition);
        item.setRoom(this.room);
        this.floorItems.set(item.getId(), item);
    }

    private loadWallItem(row: RoomItemRow, definition: FurnitureDefinition): void {
        const data: WallItemData = {
            id: row.id,
            roomId: row.room_id,
            baseItemId: row.item_id,
            ownerId: row.user_id,
            ownerName: row.username || 'Unknown',
            wallPosition: row.wall_pos || ':w=0,0 l=0,0 l',
            extraData: row.extra_data || '0'
        };

        const item = new WallItem(data, definition);
        item.setRoom(this.room);
        this.wallItems.set(item.getId(), item);
    }

    /**
     * Add a floor item to the room
     */
    public addFloorItem(item: RoomItem): void {
        item.setRoom(this.room);
        this.floorItems.set(item.getId(), item);
    }

    /**
     * Add a wall item to the room
     */
    public addWallItem(item: WallItem): void {
        item.setRoom(this.room);
        this.wallItems.set(item.getId(), item);
    }

    /**
     * Remove a floor item from the room
     */
    public removeFloorItem(itemId: number): RoomItem | undefined {
        const item = this.floorItems.get(itemId);
        if (item) {
            item.setRoom(null);
            this.floorItems.delete(itemId);
        }
        return item;
    }

    /**
     * Remove a wall item from the room
     */
    public removeWallItem(itemId: number): WallItem | undefined {
        const item = this.wallItems.get(itemId);
        if (item) {
            item.setRoom(null);
            this.wallItems.delete(itemId);
        }
        return item;
    }

    /**
     * Get floor item by ID
     */
    public getFloorItem(itemId: number): RoomItem | undefined {
        return this.floorItems.get(itemId);
    }

    /**
     * Get wall item by ID
     */
    public getWallItem(itemId: number): WallItem | undefined {
        return this.wallItems.get(itemId);
    }

    /**
     * Get all floor items
     */
    public getFloorItems(): RoomItem[] {
        return Array.from(this.floorItems.values());
    }

    /**
     * Get all wall items
     */
    public getWallItems(): WallItem[] {
        return Array.from(this.wallItems.values());
    }

    /**
     * Get items at a specific position
     */
    public getItemsAt(x: number, y: number): RoomItem[] {
        const items: RoomItem[] = [];
        for (const item of this.floorItems.values()) {
            if (item.occupiesPosition(x, y)) {
                items.push(item);
            }
        }
        // Sort by Z (highest first)
        return items.sort((a, b) => b.getZ() - a.getZ());
    }

    /**
     * Get stack height at a position
     * Java: Room.getStackHeight() logic
     * For sit/lay items, new items stack at item's Z (no height offset)
     * For other items, stack at item's Z + height
     */
    public getStackHeightAt(x: number, y: number, excludeItemId?: number): number {
        const topItem = this.getTopItemAt(x, y, excludeItemId);

        if (topItem) {
            const definition = topItem.getDefinition();

            // Check if stacking is allowed
            if (!definition.canStack()) {
                return -1; // Cannot stack
            }

            // Java: For sit/lay items, stack at item's Z (no height offset)
            // This allows placing items "on" chairs/beds at their base height
            if (definition.canSit() || definition.canLay()) {
                return topItem.getZ();
            }

            // For regular items, stack on top
            return topItem.getZ() + topItem.getStackHeight();
        }

        // No items, return floor height
        return this.room.getLayout()?.getTile(x, y)?.getZ() || 0;
    }

    /**
     * Get the highest item at a position, optionally excluding an item
     */
    public getTopItemAt(x: number, y: number, excludeItemId?: number): RoomItem | null {
        const items = this.getItemsAt(x, y);
        const filtered = excludeItemId
            ? items.filter(i => i.getId() !== excludeItemId)
            : items;
        return filtered.length > 0 ? filtered[0] : null;
    }

    /**
     * Check if position can be walked on
     */
    public canWalkAt(x: number, y: number): boolean {
        const items = this.getItemsAt(x, y);
        for (const item of items) {
            const def = item.getDefinition();
            // Can walk if item is walkable, sittable, or layable
            if (!def.isWalkable() && !def.canSit() && !def.canLay()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if position can be stacked on
     */
    public canStackAt(x: number, y: number, excludeItemId?: number): boolean {
        const topItem = this.getTopItemAt(x, y, excludeItemId);
        if (topItem && !topItem.getDefinition().canStack()) {
            return false;
        }
        return true;
    }

    /**
     * Save item position to database
     */
    public async saveItemPosition(item: RoomItem): Promise<void> {
        const db = emulator.getDatabase();
        await db.execute(
            `UPDATE items SET x = ?, y = ?, z = ?, rot = ? WHERE id = ?`,
            [item.getX(), item.getY(), item.getZ(), item.getRotation(), item.getId()]
        );
        item.setNeedsUpdate(false);
    }

    /**
     * Save item extra data to database
     */
    public async saveItemExtraData(item: RoomItem | WallItem): Promise<void> {
        const db = emulator.getDatabase();
        await db.execute(
            `UPDATE items SET extra_data = ? WHERE id = ?`,
            [item.getExtraData(), item.getId()]
        );
        item.setNeedsUpdate(false);
    }

    /**
     * Move item to inventory (remove from room)
     */
    public async pickupItem(itemId: number, isWallItem: boolean): Promise<boolean> {
        const db = emulator.getDatabase();

        try {
            await db.execute(
                `UPDATE items SET room_id = 0, x = 0, y = 0, z = 0, rot = 0, wall_pos = '' WHERE id = ?`,
                [itemId]
            );

            if (isWallItem) {
                this.removeWallItem(itemId);
            } else {
                this.removeFloorItem(itemId);
            }

            return true;
        } catch (error) {
            this.logger.error('Failed to pickup item:', error);
            return false;
        }
    }

    public getFloorItemCount(): number {
        return this.floorItems.size;
    }

    public getWallItemCount(): number {
        return this.wallItems.size;
    }

    public getTotalItemCount(): number {
        return this.floorItems.size + this.wallItems.size;
    }
}
