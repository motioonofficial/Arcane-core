/**
 * TeleportCommand - Toggle teleport mode (click to move instantly)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { commandManager } from '../CommandManager';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class TeleportCommand extends Command {
    constructor() {
        super('tele', 'Teleport modunu açar/kapatır', 'tele');
        this.aliases = ['teleport', 'tp'];
        this.permission = CommandPermission.MODERATOR;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        // Toggle teleport mode
        const current = roomUnit.isTeleporting();
        roomUnit.setTeleporting(!current);

        commandManager.sendWhisper(client, habbo, room,
            `Teleport modu ${!current ? 'açıldı' : 'kapatıldı'}.`
        );

        return true;
    }
}
