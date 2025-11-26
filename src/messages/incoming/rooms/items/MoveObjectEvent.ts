/**
 * MoveObjectEvent - Handle moving floor items in room
 * Java: RotateMoveItemEvent.java
 */

import { MessageHandler } from '../../../MessageHandler';
import { Logger } from '../../../../utils/Logger';
import { ObjectUpdateComposer } from '../../../composers/items/ObjectUpdateComposer';
import { RoomTileState } from '../../../../game/rooms/RoomLayout';

export class MoveObjectEvent extends MessageHandler {
    private logger = new Logger('MoveObjectEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        // Check if user has rights
        if (!room.hasRights(habbo)) {
            return;
        }

        const itemId = this.packet.readInt();
        const x = this.packet.readInt();
        const y = this.packet.readInt();
        let rotation = this.packet.readInt();

        // Java: rotation %= 8 - ensures 0-7 range
        rotation = rotation % 8;

        const itemManager = room.getItemManager();
        if (!itemManager) return;

        const item = itemManager.getFloorItem(itemId);
        if (!item) {
            this.logger.debug('Item not found:', itemId);
            return;
        }

        const layout = room.getLayout();
        if (!layout) return;

        // Validate position - check all tiles the item would occupy
        const definition = item.getDefinition();
        const actualWidth = (rotation === 0 || rotation === 4) ? definition.getWidth() : definition.getLength();
        const actualLength = (rotation === 0 || rotation === 4) ? definition.getLength() : definition.getWidth();

        // Check all tiles the item will occupy
        for (let dx = 0; dx < actualWidth; dx++) {
            for (let dy = 0; dy < actualLength; dy++) {
                const checkTile = layout.getTile(x + dx, y + dy);
                if (!checkTile || checkTile.getState() === RoomTileState.INVALID) {
                    // Send current position back to client (revert)
                    this.client.send(new ObjectUpdateComposer(item).compose());
                    return;
                }
            }
        }

        // Check if only rotating (same position)
        const onlyRotating = (item.getX() === x && item.getY() === y);

        // Calculate Z position using Java's method
        let z = item.getZ();
        if (!onlyRotating) {
            z = this.calculateStackHeight(x, y, actualWidth, actualLength, item.getId(), itemManager, layout);

            // Check if stacking is allowed
            if (z < 0) {
                // Cannot stack here - send current position back
                this.client.send(new ObjectUpdateComposer(item).compose());
                return;
            }
        }

        // Update item position
        item.setPosition(x, y, z, rotation);

        // Save to database
        await itemManager.saveItemPosition(item);

        // Notify room
        room.sendToAll(new ObjectUpdateComposer(item).compose());
    }

    /**
     * Calculate stack height for all occupied tiles
     * Java: Room.getStackHeight() logic
     */
    private calculateStackHeight(
        x: number,
        y: number,
        width: number,
        length: number,
        excludeItemId: number,
        itemManager: any,
        layout: any
    ): number {
        let maxHeight = 0;

        for (let dx = 0; dx < width; dx++) {
            for (let dy = 0; dy < length; dy++) {
                const tileX = x + dx;
                const tileY = y + dy;
                const tile = layout.getTile(tileX, tileY);

                if (!tile) continue;

                // Get items at this tile (excluding the item being moved)
                const itemsAtTile = itemManager.getItemsAt(tileX, tileY)
                    .filter((i: any) => i.getId() !== excludeItemId);

                let tileHeight = tile.getZ(); // Base floor height

                if (itemsAtTile.length > 0) {
                    // Get top item
                    const topItem = itemsAtTile[0]; // Already sorted by Z desc
                    const topDefinition = topItem.getDefinition();

                    // Check if we can stack on this item
                    if (!topDefinition.canStack()) {
                        return -1; // Cannot stack
                    }

                    // Java: For sit/lay items, stack at item's Z (no height offset)
                    // For other items, stack at item's Z + height
                    if (topDefinition.canSit() || topDefinition.canLay()) {
                        tileHeight = topItem.getZ();
                    } else {
                        tileHeight = topItem.getZ() + topItem.getStackHeight();
                    }
                }

                if (tileHeight > maxHeight) {
                    maxHeight = tileHeight;
                }
            }
        }

        return maxHeight;
    }

    public getRateLimit(): number {
        return 50; // 50ms rate limit
    }
}
