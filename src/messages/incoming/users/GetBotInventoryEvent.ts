/**
 * GetBotInventoryEvent - Handle bot inventory request
 */

import { MessageHandler } from '../../MessageHandler';
import { BotInventoryComposer } from '../../composers/inventory/BotInventoryComposer';

export class GetBotInventoryEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send empty bot inventory for now
        this.client.send(new BotInventoryComposer().compose());
    }

    public getRateLimit(): number {
        return 500;
    }
}
