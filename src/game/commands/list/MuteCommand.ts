/**
 * MuteCommand - Mute/unmute a user
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class MuteCommand extends Command {
    constructor() {
        super('mute', 'Kullanıcıyı susturur/açar', 'mute <kullanıcı> [dakika]');
        this.aliases = ['sustur'];
        this.permission = CommandPermission.MODERATOR;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :mute <kullanıcı> [dakika]');
            return true;
        }

        const targetName = args[0];
        const target = room.getHabboByName(targetName);

        if (!target) {
            commandManager.sendWhisper(client, habbo, room, `Kullanıcı bulunamadı: ${targetName}`);
            return true;
        }

        if (target.getId() === habbo.getId()) {
            commandManager.sendWhisper(client, habbo, room, 'Kendinizi susturamazsınız.');
            return true;
        }

        // Can't mute higher ranks
        if (target.getRank() >= habbo.getRank()) {
            commandManager.sendWhisper(client, habbo, room, 'Bu kullanıcıyı susturamazsınız.');
            return true;
        }

        let duration = 5; // Default 5 minutes
        if (args.length >= 2) {
            duration = parseInt(args[1]);
            if (isNaN(duration) || duration < 0) {
                duration = 5;
            }
        }

        // Toggle mute
        const isMuted = target.isMuted();
        if (isMuted) {
            target.setMuted(false);
            commandManager.sendWhisper(client, habbo, room, `${targetName} artık konuşabilir.`);
        } else {
            target.setMuted(true, duration * 60 * 1000); // Convert to ms
            commandManager.sendWhisper(client, habbo, room, `${targetName} ${duration} dakika susturuldu.`);
        }

        return true;
    }
}
