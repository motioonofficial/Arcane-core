/**
 * DeclineFriendRequestEvent - Decline friend requests
 */

import { MessageHandler } from '../../MessageHandler';

export class DeclineFriendRequestEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        const declineAll = this.packet.readBoolean();

        if (declineAll) {
            // Decline all friend requests
            await messenger.deleteAllFriendRequests();
        } else {
            // Decline specific requests
            const count = this.packet.readInt();

            for (let i = 0; i < count; i++) {
                const userId = this.packet.readInt();
                await messenger.deleteFriendRequests(userId, habbo.getId());
            }
        }
    }
}
