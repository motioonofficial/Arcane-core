/**
 * GetPetInventoryEvent - Handle pet inventory request
 */

import { MessageHandler } from '../../MessageHandler';
import { PetInventoryComposer } from '../../composers/inventory/PetInventoryComposer';

export class GetPetInventoryEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send empty pet inventory for now
        this.client.send(new PetInventoryComposer().compose());
    }

    public getRateLimit(): number {
        return 500;
    }
}
