/**
 * FreezeCommand - Freeze/unfreeze a user (prevent walking)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class FreezeCommand extends Command {
    constructor() {
        super('freeze', 'Kullanıcıyı dondurur/çözer', 'freeze <kullanıcı>');
        this.aliases = ['dondur'];
        this.permission = CommandPermission.MODERATOR;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :freeze <kullanıcı>');
            return true;
        }

        const targetName = args[0];
        const target = room.getHabboByName(targetName);

        if (!target) {
            commandManager.sendWhisper(client, habbo, room, `Kullanıcı bulunamadı: ${targetName}`);
            return true;
        }

        const targetUnit = target.getRoomUnit();
        if (!targetUnit) return true;

        // Toggle freeze
        const currentCanWalk = targetUnit.canUserWalk();
        targetUnit.setCanWalk(!currentCanWalk);

        if (currentCanWalk) {
            // Now frozen
            targetUnit.stopWalking();
            commandManager.sendWhisper(client, habbo, room, `${targetName} donduruldu.`);
        } else {
            // Now unfrozen
            commandManager.sendWhisper(client, habbo, room, `${targetName} çözüldü.`);
        }

        return true;
    }
}
