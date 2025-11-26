/**
 * Room - Represents a hotel room
 */

import { ServerMessage } from '../../messages/ServerMessage';
import { RoomLayout } from './RoomLayout';
import { RoomUnit, RoomUserRotation, RoomUnitType } from './RoomUnit';
import { RoomProcess } from './RoomProcess';
import { RoomItemManager } from '../items/RoomItemManager';
import type { Habbo } from '../users/Habbo';
import type { ItemManager } from '../items/ItemManager';

export enum RoomState {
    OPEN = 0,
    DOORBELL = 1,
    PASSWORD = 2,
    INVISIBLE = 3
}

export interface RoomData {
    id: number;
    ownerId: number;
    ownerName: string;
    name: string;
    description: string;
    state: RoomState;
    categoryId: number;
    usersNow: number;
    usersMax: number;
    modelName: string;
    score: number;
    tags: string;
    password: string;
    wallpaper: string;
    floor: string;
    landscape: string;
    allowPets: boolean;
    allowPetsEat: boolean;
    allowWalkthrough: boolean;
    hideWall: boolean;
    wallThickness: number;
    floorThickness: number;
    wallHeight: number;
    muteSettings: number;
    kickSettings: number;
    banSettings: number;
    chatMode: number;
    chatWeight: number;
    chatSpeed: number;
    chatHearingDistance: number;
    chatProtection: number;
    tradeSettings: number;
    guildId: number;
    isPublic: boolean;
    hasCustomLayout?: boolean;
}

export class Room {
    private data: RoomData;
    private layout: RoomLayout | null = null;
    private loaded: boolean = false;
    private roomProcess: RoomProcess;
    private itemManager: RoomItemManager | null = null;

    // Users in room
    private habbos: Map<number, Habbo> = new Map();
    private roomUnits: Map<number, RoomUnit> = new Map();
    private nextUnitId: number = 1;

    constructor(data: RoomData) {
        this.data = data;
        this.roomProcess = new RoomProcess(this);
    }

    /**
     * Initialize room item manager
     */
    public initializeItemManager(itemManager: ItemManager): void {
        this.itemManager = new RoomItemManager(this, itemManager);
    }

    /**
     * Load room items
     */
    public async loadItems(): Promise<void> {
        if (this.itemManager) {
            await this.itemManager.loadItems();
        }
    }

    /**
     * Serialize room for navigator
     */
    public serialize(message: ServerMessage): void {
        message.appendInt(this.data.id);
        message.appendString(this.data.name);
        message.appendInt(this.data.isPublic ? 0 : this.data.ownerId);
        message.appendString(this.data.isPublic ? '' : this.data.ownerName);
        message.appendInt(this.data.state);
        message.appendInt(this.getUserCount());
        message.appendInt(this.data.usersMax);
        message.appendString(this.data.description);
        message.appendInt(this.data.tradeSettings); // Trade settings
        message.appendInt(this.data.score);
        message.appendInt(0); // Ranking
        message.appendInt(this.data.categoryId);

        // Tags
        const tags = this.data.tags ? this.data.tags.split(';').filter(t => t.length > 0) : [];
        message.appendInt(tags.length);
        for (const tag of tags) {
            message.appendString(tag);
        }

        // Multi-use flags
        let flags = 0;
        if (this.data.guildId > 0) flags |= 2;
        // if (promoted) flags |= 4;
        if (!this.data.isPublic) flags |= 8;
        if (this.data.allowPets) flags |= 16;

        message.appendInt(flags);

        // Guild info
        if (this.data.guildId > 0) {
            message.appendInt(this.data.guildId);
            message.appendString(''); // Guild name
            message.appendString(''); // Guild badge
        }
    }

    /**
     * Serialize room for GetGuestRoomResult
     */
    public serializeDetails(message: ServerMessage, isLoading: boolean, checkEntry: boolean): void {
        message.appendBoolean(isLoading);

        this.serialize(message);

        message.appendBoolean(checkEntry);
        message.appendBoolean(false); // Is staff pick
        message.appendBoolean(false); // Is group member
        message.appendBoolean(false); // All in room muted

        message.appendInt(this.data.muteSettings);
        message.appendInt(this.data.kickSettings);
        message.appendInt(this.data.banSettings);

        message.appendBoolean(true); // Room muting allowed TODO: Check permission

        message.appendInt(this.data.chatMode);
        message.appendInt(this.data.chatWeight);
        message.appendInt(this.data.chatSpeed);
        message.appendInt(this.data.chatHearingDistance);
        message.appendInt(this.data.chatProtection);
    }

    // Layout methods
    public getLayout(): RoomLayout | null {
        return this.layout;
    }

    public setLayout(layout: RoomLayout): void {
        this.layout = layout;
    }

    public isLoaded(): boolean {
        return this.loaded;
    }

    public setLoaded(loaded: boolean): void {
        this.loaded = loaded;
    }

    // User management
    public addHabbo(habbo: Habbo): RoomUnit {
        const roomUnit = new RoomUnit();
        roomUnit.setId(this.nextUnitId++);
        roomUnit.setRoom(this);
        roomUnit.setUnitType(RoomUnitType.USER);
        roomUnit.setInRoom(true);

        // Set position at door
        const doorTile = this.layout?.getDoorTile();
        if (doorTile) {
            roomUnit.setPosition(doorTile.getX(), doorTile.getY(), doorTile.getStackHeight());
            const doorDir = this.layout?.getDoorDirection() || 2;
            roomUnit.setRotation(doorDir as RoomUserRotation);
        }

        habbo.setRoomUnit(roomUnit);
        this.habbos.set(habbo.getId(), habbo);
        this.roomUnits.set(roomUnit.getId(), roomUnit);

        // Start room process if first user
        if (this.habbos.size === 1) {
            this.roomProcess.start();
        }

        return roomUnit;
    }

    public removeHabbo(habbo: Habbo): void {
        const roomUnit = habbo.getRoomUnit();
        if (roomUnit) {
            this.roomUnits.delete(roomUnit.getId());
        }
        this.habbos.delete(habbo.getId());
        habbo.setRoomUnit(null);
        habbo.setCurrentRoom(null);

        // Stop room process if no users left
        if (this.habbos.size === 0) {
            this.roomProcess.stop();
        }
    }

    public getHabbo(id: number): Habbo | undefined {
        return this.habbos.get(id);
    }

    public getHabbos(): Habbo[] {
        return Array.from(this.habbos.values());
    }

    public getUserCount(): number {
        return this.habbos.size;
    }

    public getRoomUnit(id: number): RoomUnit | undefined {
        return this.roomUnits.get(id);
    }

    public getRoomUnits(): RoomUnit[] {
        return Array.from(this.roomUnits.values());
    }

    // Check methods
    public isOwner(habbo: Habbo): boolean {
        return this.data.ownerId === habbo.getId();
    }

    public hasRights(habbo: Habbo): boolean {
        // TODO: Implement room rights system
        return this.isOwner(habbo);
    }

    // Decorations
    public getWallPaint(): string {
        return this.data.wallpaper || '0.0';
    }

    public getFloorPaint(): string {
        return this.data.floor || '0.0';
    }

    public getLandscapePaint(): string {
        return this.data.landscape || '0.0';
    }

    public getWallHeight(): number {
        return this.data.wallHeight;
    }

    // Broadcast message to all users in room
    public sendToAll(message: ServerMessage): void {
        for (const habbo of this.habbos.values()) {
            habbo.getClient().send(message);
        }
    }

    // Broadcast message to all users except one
    public sendToAllExcept(message: ServerMessage, exceptId: number): void {
        for (const habbo of this.habbos.values()) {
            if (habbo.getId() !== exceptId) {
                habbo.getClient().send(message);
            }
        }
    }

    // Getters
    public getId(): number { return this.data.id; }
    public getName(): string { return this.data.name; }
    public getOwnerId(): number { return this.data.ownerId; }
    public getOwnerName(): string { return this.data.ownerName; }
    public getDescription(): string { return this.data.description; }
    public getState(): RoomState { return this.data.state; }
    public getCategoryId(): number { return this.data.categoryId; }
    public getUsersNow(): number { return this.habbos.size; }
    public getUsersMax(): number { return this.data.usersMax; }
    public getModelName(): string { return this.data.modelName; }
    public getScore(): number { return this.data.score; }
    public getGuildId(): number { return this.data.guildId; }
    public isPublicRoom(): boolean { return this.data.isPublic; }
    public getPassword(): string { return this.data.password; }
    public getData(): RoomData { return this.data; }
    public getItemManager(): RoomItemManager | null { return this.itemManager; }

    // Custom layout methods
    public hasCustomLayout(): boolean {
        return this.data.hasCustomLayout === true;
    }

    public setHasCustomLayout(value: boolean): void {
        this.data.hasCustomLayout = value;
    }
}
