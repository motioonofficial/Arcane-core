/**
 * AddItemToInventoryComposer - Notifies client of new inventory item
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { InventoryItem } from '../../../game/items/InventoryItem';

export class AddItemToInventoryComposer {
    private item: InventoryItem;
    private openInventory: boolean;

    constructor(item: InventoryItem, openInventory: boolean = true) {
        this.item = item;
        this.openInventory = openInventory;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.UnseenItemsComposer);

        message.appendInt(1); // Category count

        // Category
        const itemType = this.item.getDefinition().isFloorItem() ? 1 : 2;
        message.appendInt(itemType); // 1 = floor items, 2 = wall items
        message.appendInt(1); // Item count in category
        message.appendInt(this.item.getId()); // Item ID

        return message;
    }
}
