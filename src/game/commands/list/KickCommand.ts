/**
 * KickCommand - Kick a user from the room
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class KickCommand extends Command {
    constructor() {
        super('kick', 'Kullanıcıyı odadan atar', 'kick <kullanıcı>');
        this.aliases = ['at', 'roomkick'];
        this.permission = CommandPermission.MODERATOR;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        // Check if user has rights in the room
        if (!room.hasRights(habbo) && habbo.getRank() < CommandPermission.MODERATOR) {
            commandManager.sendWhisper(client, habbo, room, 'Bu odada yetkiniz yok.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :kick <kullanıcı>');
            return true;
        }

        const targetName = args[0];
        const target = room.getHabboByName(targetName);

        if (!target) {
            commandManager.sendWhisper(client, habbo, room, `Kullanıcı bulunamadı: ${targetName}`);
            return true;
        }

        if (target.getId() === habbo.getId()) {
            commandManager.sendWhisper(client, habbo, room, 'Kendinizi atamazsınız.');
            return true;
        }

        // Can't kick higher ranks
        if (target.getRank() >= habbo.getRank()) {
            commandManager.sendWhisper(client, habbo, room, 'Bu kullanıcıyı atamazsınız.');
            return true;
        }

        // Remove from room
        room.removeHabbo(target);
        target.setCurrentRoom(null);

        // Send room kick composer
        const response = new ServerMessage(Outgoing.GenericErrorComposer);
        response.appendInt(4008); // Room kick code
        target.getClient().send(response);

        commandManager.sendWhisper(client, habbo, room, `${targetName} odadan atıldı.`);
        return true;
    }
}
