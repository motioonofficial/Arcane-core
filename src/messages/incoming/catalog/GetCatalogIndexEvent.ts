/**
 * GetCatalogIndexEvent - Request catalog index/pages
 */

import { MessageHandler } from '../../MessageHandler';
import { game } from '../../../game/GameEnvironment';
import { CatalogIndexComposer } from '../../composers/catalog/CatalogIndexComposer';
import { Logger } from '../../../utils/Logger';

export class GetCatalogIndexEvent extends MessageHandler {
    private logger = new Logger('GetCatalogIndexEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const catalogType = this.packet.readString(); // "NORMAL" or "BUILDERS_CLUB"

        const catalogManager = game.getCatalogManager();
        const rootPages = catalogManager.getRootPages();

        // User info for access control
        const rank = habbo.getRank();
        const hasClub = habbo.hasClub();
        const isVip = habbo.isVip();

        this.logger.debug(`Catalog index requested: type=${catalogType}, rootPages=${rootPages.length}, rank=${rank}`);

        const composer = new CatalogIndexComposer(rootPages, catalogType, rank, hasClub, isVip);
        this.client.send(composer.compose());
    }
}
