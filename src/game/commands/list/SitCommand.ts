/**
 * SitCommand - Make user sit down
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { commandManager } from '../CommandManager';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class SitCommand extends Command {
    constructor() {
        super('sit', 'Oturur/kalkar', 'sit');
        this.aliases = ['otur'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        // Toggle sit status
        const isSitting = roomUnit.hasStatus('sit');

        if (isSitting) {
            roomUnit.removeStatus('sit');
        } else {
            // Calculate sit height based on current position
            const z = roomUnit.getZ();
            roomUnit.setStatus('sit', (z + 0.5).toFixed(2));
        }

        // Broadcast status update
        const response = new ServerMessage(Outgoing.RoomUserStatusComposer);
        response.appendInt(1);
        response.appendInt(roomUnit.getId());
        response.appendInt(roomUnit.getX());
        response.appendInt(roomUnit.getY());
        response.appendString(roomUnit.getZ().toFixed(2));
        response.appendInt(roomUnit.getHeadRotation());
        response.appendInt(roomUnit.getBodyRotation());
        response.appendString(roomUnit.getStatusString());

        room.sendToAll(response);
        return true;
    }
}
