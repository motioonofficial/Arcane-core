/**
 * LayCommand - Make user lay down
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class LayCommand extends Command {
    constructor() {
        super('lay', 'Uzanır', 'lay');
        this.aliases = ['uzat', 'uzan'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        if (!room) return true;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        // Toggle lay status
        if (roomUnit.hasStatus('lay')) {
            roomUnit.removeStatus('lay');
            roomUnit.setNeedsUpdate(true);
        } else {
            roomUnit.lay(0.5);
        }

        return true;
    }
}
