/**
 * RoomItem - Base class for items placed in rooms
 */

import { ServerMessage } from '../../messages/ServerMessage';
import type { FurnitureDefinition } from './FurnitureDefinition';
import type { Room } from '../rooms/Room';

export interface RoomItemData {
    id: number;
    roomId: number;
    baseItemId: number;
    ownerId: number;
    ownerName: string;
    x: number;
    y: number;
    z: number;
    rotation: number;
    extraData: string;
    limitedNumber: number;
    limitedStack: number;
}

export class RoomItem {
    protected data: RoomItemData;
    protected definition: FurnitureDefinition;
    protected room: Room | null = null;
    protected needsUpdate: boolean = false;

    constructor(data: RoomItemData, definition: FurnitureDefinition) {
        this.data = data;
        this.definition = definition;
    }

    /**
     * Serialize floor item for RoomFloorItemsComposer
     */
    public serializeFloor(message: ServerMessage): void {
        message.appendInt(this.data.id);
        message.appendInt(this.definition.getSpriteId());
        message.appendInt(this.data.x);
        message.appendInt(this.data.y);
        message.appendInt(this.data.rotation);
        message.appendString(this.formatZ(this.data.z));
        message.appendString(this.formatZ(this.getStackHeight()));

        // Extra data
        this.serializeExtraData(message);

        message.appendInt(-1); // Rental time left (-1 = no rental)
        message.appendInt(this.definition.getInteractionModesCount() > 0 ? 1 : 0); // Use mode
        message.appendInt(this.data.ownerId);
    }

    /**
     * Serialize extra data based on type
     */
    protected serializeExtraData(message: ServerMessage): void {
        const extraData = this.data.extraData || '0';

        // Limited edition
        if (this.data.limitedNumber > 0) {
            message.appendInt(1);  // Data type: limited edition
            message.appendInt(256);
            message.appendString(extraData);
            message.appendInt(this.data.limitedNumber);
            message.appendInt(this.data.limitedStack);
            return;
        }

        // Default: legacy string
        message.appendInt(1);
        message.appendInt(0);
        message.appendString(extraData);
    }

    /**
     * Get total stack height for this item
     */
    public getStackHeight(): number {
        const state = parseInt(this.data.extraData) || 0;
        return this.definition.getHeightForState(state);
    }

    /**
     * Get total height at this position (z + stack height)
     */
    public getTotalHeight(): number {
        return this.data.z + this.getStackHeight();
    }

    /**
     * Format Z coordinate for client
     */
    protected formatZ(z: number): string {
        return z.toFixed(2);
    }

    /**
     * Move item to new position
     */
    public setPosition(x: number, y: number, z: number, rotation: number): void {
        this.data.x = x;
        this.data.y = y;
        this.data.z = z;
        this.data.rotation = rotation;
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
     * Check if a position is occupied by this item
     */
    public occupiesPosition(x: number, y: number): boolean {
        const width = this.getActualWidth();
        const length = this.getActualLength();

        for (let dx = 0; dx < width; dx++) {
            for (let dy = 0; dy < length; dy++) {
                if (this.data.x + dx === x && this.data.y + dy === y) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get actual width based on rotation
     */
    public getActualWidth(): number {
        return (this.data.rotation === 0 || this.data.rotation === 4)
            ? this.definition.getWidth()
            : this.definition.getLength();
    }

    /**
     * Get actual length based on rotation
     */
    public getActualLength(): number {
        return (this.data.rotation === 0 || this.data.rotation === 4)
            ? this.definition.getLength()
            : this.definition.getWidth();
    }

    // Getters
    public getId(): number { return this.data.id; }
    public getRoomId(): number { return this.data.roomId; }
    public getBaseItemId(): number { return this.data.baseItemId; }
    public getOwnerId(): number { return this.data.ownerId; }
    public getOwnerName(): string { return this.data.ownerName; }
    public getX(): number { return this.data.x; }
    public getY(): number { return this.data.y; }
    public getZ(): number { return this.data.z; }
    public getRotation(): number { return this.data.rotation; }
    public getExtraData(): string { return this.data.extraData; }
    public getDefinition(): FurnitureDefinition { return this.definition; }
    public getRoom(): Room | null { return this.room; }
    public setRoom(room: Room | null): void { this.room = room; }
    public isNeedsUpdate(): boolean { return this.needsUpdate; }
    public setNeedsUpdate(value: boolean): void { this.needsUpdate = value; }
    public getData(): RoomItemData { return this.data; }
}
