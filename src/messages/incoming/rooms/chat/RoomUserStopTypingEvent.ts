/**
 * RoomUserStopTypingEvent
 * Client stops typing a message
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';

export class RoomUserStopTypingEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        // Create stop typing response
        const response = new ServerMessage(Outgoing.UserTypingComposer);
        response.appendInt(roomUnit.getId());
        response.appendInt(0); // 0 = not typing

        // Send to all users in room
        room.sendToAll(response);
    }
}
