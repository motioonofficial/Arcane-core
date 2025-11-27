/**
 * CatalogPageComposer - Sends catalog page with items
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { CatalogPage } from '../../../game/catalog/CatalogPage';
import type { CatalogItem } from '../../../game/catalog/CatalogItem';

export class CatalogPageComposer {
    private page: CatalogPage;
    private catalogMode: string;
    private offerId: number;

    constructor(page: CatalogPage, catalogMode: string, offerId: number = -1) {
        this.page = page;
        this.catalogMode = catalogMode;
        this.offerId = offerId;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.CatalogPageComposer);

        message.appendInt(this.page.getId());
        message.appendString(this.catalogMode);

        // Serialize page layout data
        this.serializeLayout(message);

        // Items on page
        const items = this.page.getItems();
        message.appendInt(items.length);

        for (const item of items) {
            this.serializeItem(message, item);
        }

        message.appendInt(this.offerId); // Offer ID (for direct links)
        message.appendBoolean(false); // Accept seasonal currency as credits

        // Front page items (for frontpage layouts)
        const layout = this.page.getPageLayout();
        if (layout === 'frontpage' || layout === 'frontpage4' || layout === 'frontpage_featured') {
            message.appendInt(0); // Front page featured items count
        }

        return message;
    }

    private serializeLayout(message: ServerMessage): void {
        const layout = this.page.getPageLayout();

        // Layout name
        message.appendString(layout);

        // Images (3 images: header, teaser, special)
        message.appendInt(3);
        message.appendString(this.page.getPageHeadline());
        message.appendString(this.page.getPageTeaser());
        message.appendString(this.page.getPageSpecial());

        // Texts (3 texts: text1, textDetails, textTeaser)
        message.appendInt(3);
        message.appendString(this.page.getPageText1());
        message.appendString(this.page.getPageTextDetails());
        message.appendString(this.page.getPageTextTeaser());
    }

    private serializeItem(message: ServerMessage, item: CatalogItem): void {
        message.appendInt(item.getId()); // Offer ID
        message.appendString(item.getCatalogName()); // Display name
        message.appendBoolean(false); // Is rentable
        message.appendInt(item.getCostCredits()); // Credits cost
        message.appendInt(item.getCostPoints()); // Points cost
        message.appendInt(item.getPointsType()); // 0 = duckets, 5 = diamonds
        message.appendBoolean(false); // Allow gift

        // Products in this offer
        const baseItems = item.getBaseItems();
        message.appendInt(baseItems.length);

        for (const baseItem of baseItems) {
            message.appendString(baseItem.getType().toLowerCase());
            message.appendInt(baseItem.getSpriteId());
            message.appendString(item.getExtraData()); // Extra data
            message.appendInt(item.getAmount()); // Amount
            message.appendBoolean(item.isLimited()); // Is limited

            if (item.isLimited()) {
                message.appendInt(item.getLimitedStack()); // Total stack
                message.appendInt(item.getLimitedStack() - item.getLimitedSold()); // Remaining
            }
        }

        message.appendInt(item.isClubOnly() ? 1 : 0); // Club level required
        message.appendBoolean(item.hasOffer()); // Have offer / can select amount
        message.appendBoolean(false); // Unknown
        message.appendString(item.getCatalogName() + '.png'); // Preview image
    }
}
