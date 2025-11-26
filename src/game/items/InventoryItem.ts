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
     */
    public serialize(message: ServerMessage): void {
        message.appendInt(this.data.id);
        message.appendString(this.definition.getType().toUpperCase());
        message.appendInt(this.data.id); // Ref ID
        message.appendInt(this.definition.getSpriteId());

        // Category
        const category = this.getCategory();
        message.appendInt(category);

        // Extra data based on category
        this.serializeExtraData(message, category);

        message.appendBoolean(this.definition.canRecycle());
        message.appendBoolean(this.definition.canTrade());
        message.appendBoolean(this.data.limitedNumber === 0); // Stackable if not limited
        message.appendBoolean(this.definition.canMarketplace());

        message.appendInt(-1); // Seconds to expiration (-1 = no expiration)
        message.appendBoolean(true); // Has rent period started
        message.appendInt(-1); // Room ID (-1 = not placed)

        // Slot ID for newer clients
        if (!this.definition.isWallItem()) {
            message.appendString('');
            message.appendInt(0);
        }
    }

    private getCategory(): number {
        // Limited edition
        if (this.data.limitedNumber > 0) {
            return 256;
        }
        // Default category based on interaction type
        return 1;
    }

    private serializeExtraData(message: ServerMessage, category: number): void {
        if (category === 256) {
            // Limited edition
            message.appendString(this.data.extraData || '0');
            message.appendInt(this.data.limitedNumber);
            message.appendInt(this.data.limitedStack);
        } else {
            // Default
            message.appendString(this.data.extraData || '0');
        }
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
