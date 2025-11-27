/**
 * RoomUserActionEvent - Handle user action (wave, kiss, laugh, etc.)
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';

export class RoomUserActionEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit || !roomUnit.isInRoom()) return;

        const actionId = this.packet.readInt();

        // Validate action ID (0-5)
        // 0 = None, 1 = Wave, 2 = Kiss/Blow, 3 = Laugh, 4 = Cry, 5 = Idle
        if (actionId < 0 || actionId > 5) return;

        // Reset idle timer (action counts as activity)
        roomUnit.resetIdleTimer();

        // If was idle, send un-idle
        if (roomUnit.isIdle()) {
            const idlePacket = new ServerMessage(Outgoing.RoomUnitIdleComposer);
            idlePacket.appendInt(roomUnit.getId());
            idlePacket.appendBoolean(false); // Not idle
            room.sendToAll(idlePacket);
        }

        // Broadcast action to room
        const response = new ServerMessage(Outgoing.CarryObjectComposer);
        response.appendInt(roomUnit.getId());
        response.appendInt(actionId);

        room.sendToAll(response);
    }
}
