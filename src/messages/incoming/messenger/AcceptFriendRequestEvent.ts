/**
 * AcceptFriendRequestEvent - Accept friend requests
 */

import { MessageHandler } from '../../MessageHandler';
import { Messenger } from '../../../game/messenger/Messenger';

export class AcceptFriendRequestEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        const count = this.packet.readInt();

        for (let i = 0; i < count; i++) {
            const userId = this.packet.readInt();

            if (userId === 0) return;

            // Already friends? Just delete the request
            if (messenger.getFriend(userId)) {
                await messenger.deleteFriendRequests(userId, habbo.getId());
                continue;
            }

            // Check friend limit
            if (messenger.getFriends().size >= Messenger.MAXIMUM_FRIENDS) {
                break;
            }

            // Accept the friend request
            await messenger.acceptFriendRequest(userId, habbo.getId());
        }
    }
}
