/**
 * UseFurnitureEvent - Handle interacting with floor items (toggle state)
 * Java: ToggleFloorItemEvent.java
 */

import { MessageHandler } from '../../../MessageHandler';
import { Logger } from '../../../../utils/Logger';
import { ItemStateComposer } from '../../../composers/items/ItemStateComposer';
import { ObjectUpdateComposer } from '../../../composers/items/ObjectUpdateComposer';

export class UseFurnitureEvent extends MessageHandler {
    private logger = new Logger('UseFurnitureEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const itemId = this.packet.readInt();
        const state = this.packet.readInt();

        const itemManager = room.getItemManager();
        if (!itemManager) return;

        const item = itemManager.getFloorItem(itemId);
        if (!item) {
            this.logger.debug('Item not found:', itemId);
            return;
        }

        const definition = item.getDefinition();
        const modesCount = definition.getInteractionModesCount();

        // No interaction modes
        if (modesCount <= 1) {
            return;
        }

        // Check permission for certain interaction types
        const interactionType = definition.getInteractionType();
        const requiresRights = ['gate', 'teleport', 'vendingmachine', 'dice', 'bottle'];

        if (requiresRights.includes(interactionType) && !room.hasRights(habbo)) {
            // Still allow if user is next to the item
            const roomUnit = habbo.getRoomUnit();
            if (roomUnit) {
                const distance = Math.abs(roomUnit.getX() - item.getX()) + Math.abs(roomUnit.getY() - item.getY());
                if (distance > 2) {
                    return;
                }
            }
        }

        // Toggle state
        let currentState = parseInt(item.getExtraData()) || 0;
        let newState = currentState + 1;

        if (newState >= modesCount) {
            newState = 0;
        }

        // Handle special interactions
        switch (interactionType) {
            case 'gate':
                // Gate: 0 = closed, 1 = open
                newState = currentState === 0 ? 1 : 0;
                break;

            case 'dice':
            case 'bottle':
                // Random state
                newState = Math.floor(Math.random() * (modesCount - 1)) + 1;
                break;
        }

        // Update state
        item.setExtraData(newState.toString());

        // Save to database
        await itemManager.saveItemExtraData(item);

        // Java: room.updateItemState(item)
        // For non-limited items, send ItemStateComposer (lightweight, only state)
        // For limited items, send ObjectUpdateComposer (full item data)
        const isLimited = item.getData().limitedNumber > 0;
        if (isLimited) {
            room.sendToAll(new ObjectUpdateComposer(item).compose());
        } else {
            room.sendToAll(new ItemStateComposer(item).compose());
        }
    }

    public getRateLimit(): number {
        return 200; // Prevent spam clicking
    }
}
