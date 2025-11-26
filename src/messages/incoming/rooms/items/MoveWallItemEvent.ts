/**
 * MoveWallItemEvent - Handle moving wall items in room
 */

import { MessageHandler } from '../../../MessageHandler';
import { Logger } from '../../../../utils/Logger';
import { ItemUpdateComposer } from '../../../composers/items/ItemUpdateComposer';

export class MoveWallItemEvent extends MessageHandler {
    private logger = new Logger('MoveWallItemEvent');

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
        const wallPosition = this.packet.readString();

        const itemManager = room.getItemManager();
        if (!itemManager) return;

        const item = itemManager.getWallItem(itemId);
        if (!item) {
            this.logger.debug('Wall item not found:', itemId);
            return;
        }

        // Update wall position
        item.setWallPosition(wallPosition);

        // Save to database
        const { emulator } = await import('../../../../core/Emulator');
        const db = emulator.getDatabase();
        await db.execute(
            `UPDATE items SET wall_pos = ? WHERE id = ?`,
            [wallPosition, itemId]
        );

        item.setNeedsUpdate(false);

        // Notify room
        room.sendToAll(new ItemUpdateComposer(item).compose());
    }

    public getRateLimit(): number {
        return 50;
    }
}
