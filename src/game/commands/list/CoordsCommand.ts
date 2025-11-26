/**
 * CoordsCommand - Show current coordinates
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { commandManager } from '../CommandManager';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class CoordsCommand extends Command {
    constructor() {
        super('coords', 'Mevcut koordinatları gösterir', 'coords');
        this.aliases = ['pos', 'position', 'loc'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit || !room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        const x = roomUnit.getX();
        const y = roomUnit.getY();
        const z = roomUnit.getZ().toFixed(2);
        const rot = roomUnit.getBodyRotation();

        commandManager.sendWhisper(client, habbo, room,
            `Koordinatlar: X:${x} Y:${y} Z:${z} Rot:${rot}`
        );

        return true;
    }
}
