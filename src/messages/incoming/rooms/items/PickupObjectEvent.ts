/**
 * PickupObjectEvent - Handle picking up items from room to inventory
 */

import { MessageHandler } from '../../../MessageHandler';
import { Logger } from '../../../../utils/Logger';
import { ObjectRemoveComposer } from '../../../composers/items/ObjectRemoveComposer';
import { ItemRemoveComposer } from '../../../composers/items/ItemRemoveComposer';
import { InventoryItem, type InventoryItemData } from '../../../../game/items/InventoryItem';

export class PickupObjectEvent extends MessageHandler {
    private logger = new Logger('PickupObjectEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const pickupMode = this.packet.readInt(); // 1 = pickup to inv, 2 = eject
        const itemId = this.packet.readInt();

        const itemManager = room.getItemManager();
        if (!itemManager) return;

        // Try to find as floor item first
        let item = itemManager.getFloorItem(itemId);
        let isWallItem = false;

        if (!item) {
            // Try wall item
            const wallItem = itemManager.getWallItem(itemId);
            if (!wallItem) {
                this.logger.debug('Item not found:', itemId);
                return;
            }

            // Check permission (owner or room owner)
            if (wallItem.getOwnerId() !== habbo.getId() && !room.isOwner(habbo)) {
                return;
            }

            isWallItem = true;

            // Pickup wall item
            await itemManager.pickupItem(itemId, true);

            // Add to inventory
            const inventory = habbo.getInventory();
            if (inventory) {
                const invItemData: InventoryItemData = {
                    id: wallItem.getId(),
                    userId: habbo.getId(),
                    baseItemId: wallItem.getBaseItemId(),
                    extraData: wallItem.getExtraData(),
                    limitedNumber: 0,
                    limitedStack: 0
                };
                const invItem = new InventoryItem(invItemData, wallItem.getDefinition());
                inventory.addItem(invItem);
            }

            // Notify room
            room.sendToAll(new ItemRemoveComposer(itemId, habbo.getId()).compose());
            return;
        }

        // Check permission (owner or room owner)
        if (item.getOwnerId() !== habbo.getId() && !room.isOwner(habbo)) {
            return;
        }

        // Pickup floor item
        await itemManager.pickupItem(itemId, false);

        // Add to inventory
        const inventory = habbo.getInventory();
        if (inventory) {
            const invItemData: InventoryItemData = {
                id: item.getId(),
                userId: habbo.getId(),
                baseItemId: item.getBaseItemId(),
                extraData: item.getExtraData(),
                limitedNumber: item.getData().limitedNumber,
                limitedStack: item.getData().limitedStack
            };
            const invItem = new InventoryItem(invItemData, item.getDefinition());
            inventory.addItem(invItem);
        }

        // Notify room
        room.sendToAll(new ObjectRemoveComposer(itemId, habbo.getId()).compose());
    }

    public getRateLimit(): number {
        return 100;
    }
}
