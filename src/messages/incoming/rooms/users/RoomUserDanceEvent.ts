/**
 * RoomUserDanceEvent - Handle user dance request
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';

export class RoomUserDanceEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit || !roomUnit.isInRoom()) return;

        const danceId = this.packet.readInt();

        // Validate dance ID (0-4)
        if (danceId < 0 || danceId > 4) return;

        // Can't dance while sitting or laying
        if (roomUnit.hasStatus('sit') || roomUnit.hasStatus('lay')) return;

        // Set dance type
        roomUnit.setDanceType(danceId);

        // Reset idle timer (dancing counts as activity)
        roomUnit.resetIdleTimer();

        // If was idle, send un-idle
        if (roomUnit.isIdle()) {
            const idlePacket = new ServerMessage(Outgoing.RoomUnitIdleComposer);
            idlePacket.appendInt(roomUnit.getId());
            idlePacket.appendBoolean(false); // Not idle
            room.sendToAll(idlePacket);
        }

        // Broadcast dance to room
        const response = new ServerMessage(Outgoing.DanceComposer);
        response.appendInt(roomUnit.getId());
        response.appendInt(danceId);

        room.sendToAll(response);
    }
}
