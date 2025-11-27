/**
 * DanceCommand - Change your dance style
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class DanceCommand extends Command {
    constructor() {
        super('dance', 'Dans stilini değiştirir', 'dance [0-4]');
        this.aliases = ['dans'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        let danceId = 1; // Default dance
        if (args.length >= 1) {
            danceId = parseInt(args[0]);
            if (isNaN(danceId) || danceId < 0 || danceId > 4) {
                commandManager.sendWhisper(client, habbo, room, 'Dans ID 0-4 arasında olmalı. (0=durdur)');
                return true;
            }
        }

        // Send dance composer
        const response = new ServerMessage(Outgoing.DanceComposer);
        response.appendInt(roomUnit.getId());
        response.appendInt(danceId);

        room.sendToAll(response);

        if (danceId === 0) {
            commandManager.sendWhisper(client, habbo, room, 'Dans durduruldu.');
        } else {
            commandManager.sendWhisper(client, habbo, room, `Dans ${danceId} başlatıldı.`);
        }
        return true;
    }
}
