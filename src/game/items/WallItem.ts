/**
 * WallItem - Items placed on walls
 */

import { ServerMessage } from '../../messages/ServerMessage';
import type { FurnitureDefinition } from './FurnitureDefinition';
import type { Room } from '../rooms/Room';

export interface WallItemData {
    id: number;
    roomId: number;
    baseItemId: number;
    ownerId: number;
    ownerName: string;
    wallPosition: string; // Format: ":w=x,y l=x,y l" or similar
    extraData: string;
}

export class WallItem {
    protected data: WallItemData;
    protected definition: FurnitureDefinition;
    protected room: Room | null = null;
    protected needsUpdate: boolean = false;

    constructor(data: WallItemData, definition: FurnitureDefinition) {
        this.data = data;
        this.definition = definition;
    }

    /**
     * Serialize wall item for RoomWallItemsComposer
     */
    public serialize(message: ServerMessage): void {
        message.appendString(this.data.id.toString());
        message.appendInt(this.definition.getSpriteId());
        message.appendString(this.data.wallPosition);
        message.appendString(this.data.extraData || '0');
        message.appendInt(-1); // Rental time left
        message.appendInt(this.definition.getInteractionModesCount() > 0 ? 1 : 0);
        message.appendInt(this.data.ownerId);
    }

    /**
     * Set wall position
     */
    public setWallPosition(wallPosition: string): void {
        this.data.wallPosition = wallPosition;
        this.needsUpdate = true;
    }

    /**
     * Set extra data (state)
     */
    public setExtraData(extraData: string): void {
        this.data.extraData = extraData;
        this.needsUpdate = true;
    }

    /**
     * Parse wall position to get coordinates
     * Format: ":w=x,y l=x,y l" where w=wall offset, l=local position
     */
    public parseWallPosition(): { wX: number; wY: number; lX: number; lY: number; side: string } | null {
        const match = this.data.wallPosition.match(/:w=(\d+),(\d+)\s+l=(\d+),(\d+)\s+([lr])/);
        if (!match) return null;

        return {
            wX: parseInt(match[1]),
            wY: parseInt(match[2]),
            lX: parseInt(match[3]),
            lY: parseInt(match[4]),
            side: match[5]
        };
    }

    // Getters
    public getId(): number { return this.data.id; }
    public getRoomId(): number { return this.data.roomId; }
    public getBaseItemId(): number { return this.data.baseItemId; }
    public getOwnerId(): number { return this.data.ownerId; }
    public getOwnerName(): string { return this.data.ownerName; }
    public getWallPosition(): string { return this.data.wallPosition; }
    public getExtraData(): string { return this.data.extraData; }
    public getDefinition(): FurnitureDefinition { return this.definition; }
    public getRoom(): Room | null { return this.room; }
    public setRoom(room: Room | null): void { this.room = room; }
    public isNeedsUpdate(): boolean { return this.needsUpdate; }
    public setNeedsUpdate(value: boolean): void { this.needsUpdate = value; }
    public getData(): WallItemData { return this.data; }
}
