/**
 * CatalogIndexComposer - Sends catalog page index/hierarchy
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { CatalogPage } from '../../../game/catalog/CatalogPage';

export class CatalogIndexComposer {
    private rootPages: CatalogPage[];
    private catalogType: string;
    private rank: number;
    private hasClub: boolean;
    private isVip: boolean;

    constructor(rootPages: CatalogPage[], catalogType: string, rank: number, hasClub: boolean, isVip: boolean) {
        this.rootPages = rootPages;
        this.catalogType = catalogType;
        this.rank = rank;
        this.hasClub = hasClub;
        this.isVip = isVip;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.CatalogIndexComposer);

        // Root node
        message.appendBoolean(true); // visible
        message.appendInt(0); // icon
        message.appendInt(-1); // page id
        message.appendString('root'); // page name
        message.appendString(''); // localization
        message.appendInt(0); // offer ids count

        // Write children recursively
        const accessibleRoots = this.rootPages.filter(p => p.canAccess(this.rank, this.hasClub, this.isVip));
        message.appendInt(accessibleRoots.length);

        for (const page of accessibleRoots) {
            this.serializePage(message, page);
        }

        message.appendBoolean(false); // new additions
        message.appendString(this.catalogType); // catalog type

        return message;
    }

    private serializePage(message: ServerMessage, page: CatalogPage): void {
        message.appendBoolean(page.isVisible());
        message.appendInt(page.getIconImage());
        message.appendInt(page.isEnabled() ? page.getId() : -1); // -1 if disabled
        message.appendString(page.getCaptionSave()); // page identifier
        message.appendString(page.getCaption()); // display caption

        // Offer IDs (for featured items)
        message.appendInt(0);

        // Children
        const children = page.getChildren().filter(p => p.canAccess(this.rank, this.hasClub, this.isVip));
        message.appendInt(children.length);

        for (const child of children) {
            this.serializePage(message, child);
        }
    }
}
