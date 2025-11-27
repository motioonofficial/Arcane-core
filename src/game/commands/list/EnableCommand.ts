/**
 * EnableCommand - Enable/disable avatar effects
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class EnableCommand extends Command {
    constructor() {
        super('enable', 'Efekt açar/kapatır', 'enable <efekt_id>');
        this.aliases = ['effect', 'efekt', 'e'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :enable <efekt_id>');
            return true;
        }

        const effectId = parseInt(args[0]);
        if (isNaN(effectId)) {
            commandManager.sendWhisper(client, habbo, room, 'Geçersiz efekt ID.');
            return true;
        }

        // Apply effect to user
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        // Send avatar effect composer
        const response = new ServerMessage(Outgoing.AvatarEffectComposer);
        response.appendInt(roomUnit.getId());
        response.appendInt(effectId);
        response.appendInt(0); // Delay

        room.sendToAll(response);

        commandManager.sendWhisper(client, habbo, room, `Efekt ${effectId} uygulandı.`);
        return true;
    }
}
