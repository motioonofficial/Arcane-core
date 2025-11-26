/**
 * GetGuestRoomEvent
 * Client requests room details (when clicking on room in navigator)
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';

export class GetGuestRoomEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const roomId = this.packet.readInt();
        const enterRoom = this.packet.readInt(); // 0 = just info, 1 = entering
        const forwardRoom = this.packet.readInt(); // 1 = forward to room

        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const roomManager = emulator.getGameEnvironment().getRoomManager();
        const room = await roomManager.getRoom(roomId);

        if (!room) {
            // Room not found
            return;
        }

        const response = new ServerMessage(Outgoing.GetGuestRoomResultComposer);
        room.serializeDetails(response, enterRoom === 1, forwardRoom === 1);

        this.client.send(response);
    }
}
