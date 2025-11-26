/**
 * RoomUserShoutEvent (ShoutEvent)
 * Client sends a shout message in the room (visible to everyone)
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';

export class RoomUserShoutEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        const message = this.packet.readString();
        const bubbleId = this.packet.readInt();

        // Don't process empty messages
        if (!message || message.trim().length === 0) return;

        // Max message length
        if (message.length > 100) return;

        // Detect emotion from message
        const emotion = this.detectEmotion(message);

        // Create shout response
        const response = new ServerMessage(Outgoing.ShoutComposer);
        response.appendInt(roomUnit.getId());
        response.appendString(message);
        response.appendInt(emotion);
        response.appendInt(bubbleId);
        response.appendInt(0); // Links count
        response.appendInt(message.length);

        // Send to all users in room
        room.sendToAll(response);
    }

    private detectEmotion(message: string): number {
        if (message.includes(':)') || message.includes(':-)') || message.includes(':]')) {
            return 1; // Smile
        } else if (message.includes(':@') || message.includes('>:(')) {
            return 2; // Angry
        } else if (message.includes(':o') || message.includes(':O') || message.includes('O.o')) {
            return 3; // Surprised
        } else if (message.includes(':(') || message.includes(':-(') || message.includes(':[')) {
            return 4; // Sad
        }
        return 0; // No emotion
    }
}
