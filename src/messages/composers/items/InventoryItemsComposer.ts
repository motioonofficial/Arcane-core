/**
 * InventoryItemsComposer - Sends user inventory items
 * Packet format matches FurnitureListComposer from Java Arcturus
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { Logger } from '../../../utils/Logger';
import type { InventoryItem } from '../../../game/items/InventoryItem';

export class InventoryItemsComposer {
    private logger = new Logger('InventoryItemsComposer');
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

        // FurnitureListComposer format:
        // int totalPages
        // int pageIndex (0-indexed)
        // int itemCount
        // for each item: item.serialize()
        message.appendInt(this.totalPages);
        message.appendInt(this.pageNumber);
        message.appendInt(this.items.length);

        this.logger.debug(`Composing inventory: header=${Outgoing.InventoryComposer}, pages=${this.totalPages}, page=${this.pageNumber}, items=${this.items.length}`);

        for (const item of this.items) {
            item.serialize(message);
        }

        return message;
    }
}
