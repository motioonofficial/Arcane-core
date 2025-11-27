/**
 * FriendPrivateMessageEvent - Send private message to a friend
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { game } from '../../../game/GameEnvironment';

export class FriendPrivateMessageEvent extends MessageHandler {
    // Rate limit: minimum 750ms between messages
    private static lastChat: Map<number, number> = new Map();

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const userId = this.packet.readInt();
        let message = this.packet.readString();

        if (!message || message.length === 0) return;

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        // Check rate limit (750ms)
        const now = Date.now();
        const lastTime = FriendPrivateMessageEvent.lastChat.get(habbo.getId()) || 0;
        if (now - lastTime < 750) {
            return;
        }
        FriendPrivateMessageEvent.lastChat.set(habbo.getId(), now);

        // Check if friend
        const buddy = messenger.getFriend(userId);
        if (!buddy) return;

        // Truncate message if too long
        if (message.length > 255) {
            message = message.substring(0, 255);
        }

        // Get target habbo
        const targetHabbo = game.getHabboManager()?.getOnlineHabbo(userId);
        if (!targetHabbo) return;

        const targetClient = targetHabbo.getClient();
        if (!targetClient) return;

        // Send message to target
        const response = new ServerMessage(Outgoing.NewConsoleMessageComposer);
        response.appendInt(habbo.getId());
        response.appendString(message);
        response.appendInt(0); // Seconds ago

        targetClient.send(response);
    }
}
