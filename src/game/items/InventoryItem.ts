/**
 * InventoryItem - Item in user's inventory
 */

import { ServerMessage } from '../../messages/ServerMessage';
import type { FurnitureDefinition } from './FurnitureDefinition';

export interface InventoryItemData {
    id: number;
    userId: number;
    baseItemId: number;
    extraData: string;
    limitedNumber: number;
    limitedStack: number;
}

export class InventoryItem {
    private data: InventoryItemData;
    private definition: FurnitureDefinition;

    constructor(data: InventoryItemData, definition: FurnitureDefinition) {
        this.data = data;
        this.definition = definition;
    }

    /**
     * Serialize for inventory composer
     * Format matches Java Arcturus emulator
     */
    public serialize(message: ServerMessage): void {
        message.appendInt(this.data.id); // Item ID
        message.appendString(this.definition.getType().toUpperCase()); // "S" or "I"
        message.appendInt(this.data.id); // Reference ID
        message.appendInt(this.definition.getSpriteId()); // Sprite ID

        // Category (1 = regular furniture)
        message.appendInt(1);

        // Extra data serialization (matches InteractionDefault.serializeExtradata)
        message.appendInt(this.isLimited() ? 256 : 0); // 256 = limited, 0 = normal
        message.appendString(this.data.extraData || '0'); // Extra data

        // If limited, add limited info
        if (this.isLimited()) {
            message.appendInt(this.data.limitedNumber); // Limited sells/number
            message.appendInt(this.data.limitedStack); // Limited stack
        }

        message.appendBoolean(this.definition.canRecycle());
        message.appendBoolean(this.definition.canTrade());
        message.appendBoolean(!this.isLimited() && this.definition.canInventoryStack()); // Stackable
        message.appendBoolean(this.definition.canMarketplace());

        message.appendInt(-1); // Seconds to expiration (-1 = no expiration)
        message.appendBoolean(true); // Has rent period started
        message.appendInt(-1); // Room ID (-1 = not placed)

        // Floor items need extra data at the end
        if (this.definition.isFloorItem()) {
            message.appendString(''); // Slot ID
            message.appendInt(1); // Unknown (gift color/ribbon in Java)
        }
    }

    /**
     * Check if this is a limited edition item
     */
    public isLimited(): boolean {
        return this.data.limitedNumber > 0 && this.data.limitedStack > 0;
    }

    // Getters
    public getId(): number { return this.data.id; }
    public getUserId(): number { return this.data.userId; }
    public getBaseItemId(): number { return this.data.baseItemId; }
    public getExtraData(): string { return this.data.extraData; }
    public getLimitedNumber(): number { return this.data.limitedNumber; }
    public getLimitedStack(): number { return this.data.limitedStack; }
    public getDefinition(): FurnitureDefinition { return this.definition; }
    public getData(): InventoryItemData { return this.data; }

    public setExtraData(extraData: string): void {
        this.data.extraData = extraData;
    }
}
