/**
 * GetInventoryEvent - Handle inventory request
 */

import { MessageHandler } from '../../MessageHandler';
import { Logger } from '../../../utils/Logger';
import { InventoryItemsComposer } from '../../composers/items/InventoryItemsComposer';

export class GetInventoryEvent extends MessageHandler {
    private logger = new Logger('GetInventoryEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) {
            this.logger.debug('No habbo for client');
            return;
        }

        const inventory = habbo.getInventory();
        if (!inventory) {
            this.logger.debug('No inventory for user:', habbo.getId());
            return;
        }

        this.logger.info(`GetInventoryEvent called for user ${habbo.getId()}`);

        // Load if not loaded
        if (!inventory.isLoaded()) {
            this.logger.debug('Loading inventory...');
            await inventory.load();
            this.logger.debug('Inventory loaded');
        }

        const items = inventory.getItems();
        this.logger.info(`Sending inventory: ${items.length} items for user ${habbo.getId()}`);

        // Send inventory (can be paginated for large inventories)
        const itemsPerPage = 500;
        const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

        for (let page = 0; page < totalPages; page++) {
            const start = page * itemsPerPage;
            const end = Math.min(start + itemsPerPage, items.length);
            const pageItems = items.slice(start, end);

            try {
                const composer = new InventoryItemsComposer(page, totalPages, pageItems);
                this.client.send(composer.compose());
                this.logger.debug(`Sent inventory page ${page + 1}/${totalPages} with ${pageItems.length} items`);
            } catch (error) {
                this.logger.error('Error sending inventory:', error);
            }
        }
    }

    public getRateLimit(): number {
        return 500; // Prevent spam
    }
}
