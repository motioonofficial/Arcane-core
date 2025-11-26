/**
 * InventoryItemsComposer - Sends user inventory items
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { InventoryItem } from '../../../game/items/InventoryItem';

export class InventoryItemsComposer {
    private pageNumber: number;
    private totalPages: number;
    private items: InventoryItem[];

    constructor(pageNumber: number, totalPages: number, items: InventoryItem[]) {
        this.pageNumber = pageNumber;
        this.totalPages = totalPages;
        this.items = items;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.InventoryComposer);

        message.appendInt(this.totalPages);
        message.appendInt(this.pageNumber);
        message.appendInt(this.items.length);

        for (const item of this.items) {
            item.serialize(message);
        }

        return message;
    }
}
