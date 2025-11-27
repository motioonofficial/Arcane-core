/**
 * FriendRequestEvent - Send a friend request to a user
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';
import { Messenger } from '../../../game/messenger/Messenger';
import { game } from '../../../game/GameEnvironment';

export class FriendRequestEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const username = this.packet.readString();
        if (!username) return;

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        // Find target user
        const db = emulator.getDatabase();
        const rows = await db.query(
            'SELECT id, username, look FROM users WHERE username = ? LIMIT 1',
            [username]
        );

        if (rows.length === 0) {
            // User not found
            this.sendError(0); // TARGET_NOT_FOUND
            return;
        }

        const targetId = rows[0].id;

        // Can't add yourself
        if (targetId === habbo.getId()) {
            return;
        }

        // Check if already friends
        if (messenger.getFriend(targetId)) {
            return;
        }

        // Check if request already exists
        const requestExists = await Messenger.friendRequestExists(habbo.getId(), targetId);
        if (requestExists) {
            return;
        }

        // Check own friend limit
        if (messenger.getFriends().size >= Messenger.MAXIMUM_FRIENDS) {
            this.sendError(1); // FRIEND_LIST_OWN_FULL
            return;
        }

        // Create friend request
        await Messenger.makeFriendRequest(habbo.getId(), targetId);

        // Notify target if online
        const targetHabbo = game.getHabboManager()?.getOnlineHabbo(targetId);
        if (targetHabbo) {
            const response = new ServerMessage(Outgoing.NewBuddyRequestComposer);
            response.appendInt(habbo.getId());
            response.appendString(habbo.getUsername());
            response.appendString(habbo.getLook());
            targetHabbo.getClient().send(response);
        }
    }

    private sendError(code: number): void {
        const response = new ServerMessage(Outgoing.GenericErrorComposer);
        response.appendInt(code);
        this.client.send(response);
    }
}
