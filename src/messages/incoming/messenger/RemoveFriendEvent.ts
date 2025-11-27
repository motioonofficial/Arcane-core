/**
 * RemoveFriendEvent - Remove friends from friend list
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { Messenger } from '../../../game/messenger/Messenger';
import { game } from '../../../game/GameEnvironment';

export class RemoveFriendEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        const count = this.packet.readInt();
        const removedIds: number[] = [];

        for (let i = 0; i < count; i++) {
            const friendId = this.packet.readInt();
            removedIds.push(friendId);

            // Remove from database
            await Messenger.unfriend(habbo.getId(), friendId);

            // Remove from local list
            messenger.removeBuddy(friendId);

            // Notify friend if online
            const friendHabbo = game.getHabboManager()?.getOnlineHabbo(friendId);
            if (friendHabbo) {
                const friendMessenger = friendHabbo.getMessenger();
                if (friendMessenger) {
                    friendMessenger.removeBuddy(habbo.getId());

                    // Send update to friend
                    const friendUpdate = new ServerMessage(Outgoing.FriendListUpdateComposer);
                    friendUpdate.appendInt(0); // Categories
                    friendUpdate.appendInt(1); // Updates count
                    friendUpdate.appendInt(-1); // Action: removed
                    friendUpdate.appendInt(habbo.getId());
                    friendHabbo.getClient().send(friendUpdate);
                }
            }
        }

        // Send update to self
        const response = new ServerMessage(Outgoing.FriendListUpdateComposer);
        response.appendInt(0); // Categories
        response.appendInt(removedIds.length);

        for (const id of removedIds) {
            response.appendInt(-1); // Action: removed
            response.appendInt(id);
        }

        this.client.send(response);
    }
}
