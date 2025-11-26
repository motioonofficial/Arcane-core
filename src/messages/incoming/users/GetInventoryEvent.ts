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
        if (!habbo) return;

        const inventory = habbo.getInventory();
        if (!inventory) {
            this.logger.debug('No inventory for user:', habbo.getId());
            return;
        }

        // Load if not loaded
        if (!inventory.isLoaded()) {
            await inventory.load();
        }

        const items = inventory.getItems();

        // Send inventory (can be paginated for large inventories)
        const itemsPerPage = 500;
        const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

        for (let page = 0; page < totalPages; page++) {
            const start = page * itemsPerPage;
            const end = Math.min(start + itemsPerPage, items.length);
            const pageItems = items.slice(start, end);

            this.client.send(new InventoryItemsComposer(page, totalPages, pageItems).compose());
        }
    }

    public getRateLimit(): number {
        return 500; // Prevent spam
    }
}
