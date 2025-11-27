/**
 * PurchaseOkComposer - Confirms successful purchase
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { CatalogItem } from '../../../game/catalog/CatalogItem';
import type { InventoryItem } from '../../../game/items/InventoryItem';

export class PurchaseOkComposer {
    private item: CatalogItem;
    private purchasedItem: InventoryItem | null;

    constructor(item: CatalogItem, purchasedItem: InventoryItem | null = null) {
        this.item = item;
        this.purchasedItem = purchasedItem;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.PurchaseOkComposer);

        const baseItem = this.item.getBaseItem();

        // Product data
        message.appendInt(this.item.getId()); // Offer ID
        message.appendString(this.item.getCatalogName()); // Product name
        message.appendBoolean(false); // Is rental
        message.appendInt(this.item.getCostCredits()); // Credits
        message.appendInt(this.item.getCostPoints()); // Points
        message.appendInt(this.item.getPointsType()); // Points type

        message.appendBoolean(true); // Gift wrapped

        // Products in offer
        const baseItems = this.item.getBaseItems();
        message.appendInt(baseItems.length);

        for (const item of baseItems) {
            message.appendString(item.getType().toUpperCase());
            message.appendInt(item.getSpriteId());
            message.appendString(this.item.getExtraData());
            message.appendInt(this.item.getAmount());
            message.appendBoolean(this.item.isLimited());

            if (this.item.isLimited() && this.purchasedItem) {
                message.appendInt(this.purchasedItem.getLimitedNumber());
                message.appendInt(this.purchasedItem.getLimitedStack());
            } else if (this.item.isLimited()) {
                message.appendInt(this.item.getLimitedSold());
                message.appendInt(this.item.getLimitedStack());
            }
        }

        message.appendInt(0); // Club level
        message.appendBoolean(false); // Can purchase multiple

        return message;
    }
}
