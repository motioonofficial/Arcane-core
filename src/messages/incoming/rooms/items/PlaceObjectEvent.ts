/**
 * PlaceObjectEvent - Handle placing items from inventory into room
 */

import { MessageHandler } from '../../../MessageHandler';
import { Logger } from '../../../../utils/Logger';
import { emulator } from '../../../../core/Emulator';
import { RoomItem, type RoomItemData } from '../../../../game/items/RoomItem';
import { WallItem, type WallItemData } from '../../../../game/items/WallItem';
import { ObjectAddComposer } from '../../../composers/items/ObjectAddComposer';
import { ItemAddComposer } from '../../../composers/items/ItemAddComposer';

export class PlaceObjectEvent extends MessageHandler {
    private logger = new Logger('PlaceObjectEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        // Check if user has rights
        if (!room.hasRights(habbo)) {
            return;
        }

        // Parse placement string
        // Format: "itemId x y rotation" for floor items
        // Format: "itemId :w=x,y l=x,y side" for wall items
        const placementString = this.packet.readString();
        const parts = placementString.split(' ');

        if (parts.length < 2) {
            this.logger.debug('Invalid placement string:', placementString);
            return;
        }

        const itemId = parseInt(parts[0]);
        if (isNaN(itemId)) return;

        // Get item from inventory
        const inventory = habbo.getInventory();
        if (!inventory) return;

        const inventoryItem = inventory.getItem(itemId);
        if (!inventoryItem) {
            this.logger.debug('Item not in inventory:', itemId);
            return;
        }

        const definition = inventoryItem.getDefinition();
        const isWallItem = definition.isWallItem();

        const db = emulator.getDatabase();
        const itemManager = room.getItemManager();
        if (!itemManager) return;

        if (isWallItem) {
            // Wall item placement
            // Format: "itemId :w=x,y l=x,y side"
            const wallPos = parts.slice(1).join(' ');

            // Update database
            await db.execute(
                `UPDATE items SET room_id = ?, wall_pos = ? WHERE id = ? AND user_id = ?`,
                [room.getId(), wallPos, itemId, habbo.getId()]
            );

            // Create wall item
            const wallItemData: WallItemData = {
                id: itemId,
                roomId: room.getId(),
                baseItemId: inventoryItem.getBaseItemId(),
                ownerId: habbo.getId(),
                ownerName: habbo.getUsername(),
                wallPosition: wallPos,
                extraData: inventoryItem.getExtraData()
            };

            const wallItem = new WallItem(wallItemData, definition);
            itemManager.addWallItem(wallItem);

            // Remove from inventory
            inventory.removeItem(itemId);

            // Notify room
            room.sendToAll(new ItemAddComposer(wallItem).compose());

        } else {
            // Floor item placement
            if (parts.length < 4) {
                this.logger.debug('Invalid floor placement:', placementString);
                return;
            }

            const x = parseInt(parts[1]);
            const y = parseInt(parts[2]);
            const rotation = parseInt(parts[3]);

            if (isNaN(x) || isNaN(y) || isNaN(rotation)) return;

            // Validate position
            const tile = room.getLayout()?.getTile(x, y);
            if (!tile || tile.getState() === 0) { // 0 = blocked
                return;
            }

            // Check if can place (stacking)
            if (!itemManager.canStackAt(x, y)) {
                return;
            }

            // Calculate Z position
            const z = itemManager.getStackHeightAt(x, y);

            // Update database
            await db.execute(
                `UPDATE items SET room_id = ?, x = ?, y = ?, z = ?, rot = ? WHERE id = ? AND user_id = ?`,
                [room.getId(), x, y, z, rotation, itemId, habbo.getId()]
            );

            // Create room item
            const roomItemData: RoomItemData = {
                id: itemId,
                roomId: room.getId(),
                baseItemId: inventoryItem.getBaseItemId(),
                ownerId: habbo.getId(),
                ownerName: habbo.getUsername(),
                x: x,
                y: y,
                z: z,
                rotation: rotation,
                extraData: inventoryItem.getExtraData(),
                limitedNumber: inventoryItem.getLimitedNumber(),
                limitedStack: inventoryItem.getLimitedStack()
            };

            const roomItem = new RoomItem(roomItemData, definition);
            itemManager.addFloorItem(roomItem);

            // Remove from inventory
            inventory.removeItem(itemId);

            // Notify room
            room.sendToAll(new ObjectAddComposer(roomItem).compose());
        }
    }

    public getRateLimit(): number {
        return 100; // 100ms rate limit
    }
}
