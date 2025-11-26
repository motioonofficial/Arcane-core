/**
 * RoomUserWhisperEvent (WhisperEvent)
 * Client sends a whisper message to a specific user in the room
 * Format: "username message"
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';

export class RoomUserWhisperEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        const data = this.packet.readString();
        const bubbleId = this.packet.readInt();

        // Parse target username and message
        // Format: "username message"
        const spaceIndex = data.indexOf(' ');
        if (spaceIndex === -1) return;

        const targetUsername = data.substring(0, spaceIndex);
        const message = data.substring(spaceIndex + 1);

        // Don't process empty messages
        if (!message || message.trim().length === 0) return;

        // Max message length
        if (message.length > 100) return;

        // Find target user in room
        const targetHabbo = room.getHabbos().find(h =>
            h.getUsername().toLowerCase() === targetUsername.toLowerCase()
        );

        if (!targetHabbo) return;

        const targetRoomUnit = targetHabbo.getRoomUnit();
        if (!targetRoomUnit) return;

        // Detect emotion from message
        const emotion = this.detectEmotion(message);

        // Create whisper response
        const response = new ServerMessage(Outgoing.WhisperComposer);
        response.appendInt(roomUnit.getId());
        response.appendString(message);
        response.appendInt(emotion);
        response.appendInt(bubbleId);
        response.appendInt(0); // Links count
        response.appendInt(message.length);

        // Send to target user
        targetHabbo.getClient().send(response);

        // Also send to sender (so they see their own whisper)
        if (habbo.getId() !== targetHabbo.getId()) {
            this.client.send(response);
        }
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
