/**
 * PickallCommand - Pick up all furniture in the room (Room owner only)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { commandManager } from '../CommandManager';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class PickallCommand extends Command {
    constructor() {
        super('pickall', 'Odadaki tüm eşyaları toplar', 'pickall');
        this.aliases = ['eject', 'empty'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        // Must be room owner
        if (!room.isOwner(habbo)) {
            commandManager.sendWhisper(client, habbo, room, 'Bu komutu sadece oda sahibi kullanabilir.');
            return true;
        }

        const itemManager = room.getItemManager();
        if (!itemManager) {
            return true;
        }

        const floorItems = itemManager.getFloorItems();
        const wallItems = itemManager.getWallItems();
        let pickedCount = 0;

        // Pick up floor items
        for (const item of floorItems) {
            await itemManager.pickupItem(item.getId(), false);

            // Send remove notification
            const removeMsg = new ServerMessage(Outgoing.ObjectRemoveComposer);
            removeMsg.appendString(item.getId().toString());
            removeMsg.appendBoolean(false); // Is expired
            removeMsg.appendInt(habbo.getId()); // Picker ID
            removeMsg.appendInt(0); // Delay
            room.sendToAll(removeMsg);

            pickedCount++;
        }

        // Pick up wall items
        for (const item of wallItems) {
            await itemManager.pickupItem(item.getId(), true);

            // Send remove notification
            const removeMsg = new ServerMessage(Outgoing.ItemRemoveComposer);
            removeMsg.appendString(item.getId().toString());
            removeMsg.appendInt(habbo.getId());
            room.sendToAll(removeMsg);

            pickedCount++;
        }

        commandManager.sendWhisper(client, habbo, room,
            `${pickedCount} eşya envanterinize taşındı.`
        );

        return true;
    }
}
