/**
 * GetCatalogPageEvent - Request specific catalog page
 */

import { MessageHandler } from '../../MessageHandler';
import { game } from '../../../game/GameEnvironment';
import { CatalogPageComposer } from '../../composers/catalog/CatalogPageComposer';

export class GetCatalogPageEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const pageId = this.packet.readInt();
        const offerId = this.packet.readInt();
        const catalogMode = this.packet.readString(); // "NORMAL" or "BUILDERS_CLUB"

        const catalogManager = game.getCatalogManager();
        const page = catalogManager.getPage(pageId);

        if (!page) {
            return;
        }

        // Check access
        const rank = habbo.getRank();
        const hasClub = habbo.hasClub();
        const isVip = habbo.isVip();

        if (!page.canAccess(rank, hasClub, isVip)) {
            return;
        }

        const composer = new CatalogPageComposer(page, catalogMode, offerId);
        this.client.send(composer.compose());
    }
}
