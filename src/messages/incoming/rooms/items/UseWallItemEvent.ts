/**
 * UseWallItemEvent - Handle interacting with wall items (toggle state)
 */

import { MessageHandler } from '../../../MessageHandler';
import { Logger } from '../../../../utils/Logger';
import { ItemUpdateComposer } from '../../../composers/items/ItemUpdateComposer';

export class UseWallItemEvent extends MessageHandler {
    private logger = new Logger('UseWallItemEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const itemId = this.packet.readInt();
        const state = this.packet.readInt();

        const itemManager = room.getItemManager();
        if (!itemManager) return;

        const item = itemManager.getWallItem(itemId);
        if (!item) {
            this.logger.debug('Wall item not found:', itemId);
            return;
        }

        const definition = item.getDefinition();
        const modesCount = definition.getInteractionModesCount();

        // No interaction modes
        if (modesCount <= 1) {
            return;
        }

        // Toggle state
        let currentState = parseInt(item.getExtraData()) || 0;
        let newState = currentState + 1;

        if (newState >= modesCount) {
            newState = 0;
        }

        // Update state
        item.setExtraData(newState.toString());

        // Save to database
        await itemManager.saveItemExtraData(item);

        // Notify room
        room.sendToAll(new ItemUpdateComposer(item).compose());
    }

    public getRateLimit(): number {
        return 200;
    }
}
