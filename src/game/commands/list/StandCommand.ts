/**
 * StandCommand - Make user stand up
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { RoomUnitStatus } from '../../rooms/RoomUnit';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class StandCommand extends Command {
    constructor() {
        super('stand', 'Ayağa kalkar', 'stand');
        this.aliases = ['kalk'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        if (!room) return true;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        // Remove sit and lay statuses
        roomUnit.removeStatus(RoomUnitStatus.SIT);
        roomUnit.removeStatus(RoomUnitStatus.LAY);
        roomUnit.setNeedsUpdate(true);

        return true;
    }
}
