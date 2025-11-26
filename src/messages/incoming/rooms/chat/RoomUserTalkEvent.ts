/**
 * RoomUserTalkEvent (ChatEvent)
 * Client sends a chat message in the room
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';
import { Logger } from '../../../../utils/Logger';
import { commandManager } from '../../../../game/commands/CommandManager';

export class RoomUserTalkEvent extends MessageHandler {
    private logger = new Logger('RoomUserTalkEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        const roomUnit = habbo.getRoomUnit();

        const message = this.packet.readString();
        const bubbleId = this.packet.readInt();

        // Don't process empty messages
        if (!message || message.trim().length === 0) return;

        // Max message length
        if (message.length > 100) return;

        // Check if message is a command
        const isCommand = await commandManager.handleCommand(this.client, habbo, room, message);
        if (isCommand) {
            return; // Command was handled, don't broadcast as chat
        }

        // Need to be in a room for normal chat
        if (!room || !roomUnit) return;

        // Log chat message
        this.logger.chat('talk', {
            userId: habbo.getId(),
            username: habbo.getUsername(),
            message: message,
            roomId: room.getId()
        });

        // Detect emotion from message
        const emotion = this.detectEmotion(message);

        // Create chat response
        const response = new ServerMessage(Outgoing.ChatComposer);
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
