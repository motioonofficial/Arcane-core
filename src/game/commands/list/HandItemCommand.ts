/**
 * HandItemCommand - Give yourself a hand item (like drinks, signs)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class HandItemCommand extends Command {
    constructor() {
        super('handitem', 'El eşyası verir', 'handitem <id>');
        this.aliases = ['hand', 'item', 'drink', 'carry'];
        this.permission = CommandPermission.VIP;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :handitem <id> (0=bırak)');
            return true;
        }

        const itemId = parseInt(args[0]);
        if (isNaN(itemId)) {
            commandManager.sendWhisper(client, habbo, room, 'Geçersiz eşya ID.');
            return true;
        }

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        // Send carry item composer
        const response = new ServerMessage(Outgoing.CarryObjectComposer);
        response.appendInt(roomUnit.getId());
        response.appendInt(itemId);

        room.sendToAll(response);

        if (itemId === 0) {
            commandManager.sendWhisper(client, habbo, room, 'El eşyası bırakıldı.');
        } else {
            commandManager.sendWhisper(client, habbo, room, `El eşyası ${itemId} alındı.`);
        }
        return true;
    }
}
