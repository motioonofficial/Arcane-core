/**
 * MessengerInitEvent - Initialize messenger (friends list)
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { Messenger } from '../../../game/messenger/Messenger';

export class MessengerInitEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        // Load friends and friend requests from database
        await messenger.loadFriends();
        await messenger.loadFriendRequests();

        // Send messenger init
        const init = new ServerMessage(Outgoing.MessengerInitComposer);
        init.appendInt(Messenger.MAXIMUM_FRIENDS); // Max friends normal
        init.appendInt(300); // Default max
        init.appendInt(Messenger.MAXIMUM_FRIENDS_HC); // Max friends VIP
        init.appendInt(0); // Friend categories count
        this.client.send(init);

        // Send friends list
        const friends = messenger.getFriends();
        const friendsList = Array.from(friends.values());

        // Calculate pages (750 friends per page)
        const totalPages = Math.max(1, Math.ceil(friendsList.length / 750));

        for (let page = 0; page < totalPages; page++) {
            const start = page * 750;
            const end = Math.min(start + 750, friendsList.length);
            const pageFriends = friendsList.slice(start, end);

            const buddyList = new ServerMessage(Outgoing.BuddyListComposer);
            buddyList.appendInt(totalPages);
            buddyList.appendInt(page);
            buddyList.appendInt(pageFriends.length);

            for (const buddy of pageFriends) {
                buddyList.appendInt(buddy.getId());
                buddyList.appendString(buddy.getUsername());
                buddyList.appendInt(buddy.getGender() === 'M' ? 0 : 1);
                buddyList.appendBoolean(buddy.getOnline() === 1);
                buddyList.appendBoolean(buddy.isInRoom());
                buddyList.appendString(buddy.getOnline() === 1 ? buddy.getLook() : '');
                buddyList.appendInt(buddy.getCategoryId()); // Category ID
                buddyList.appendString(buddy.getMotto());
                buddyList.appendString(''); // Last seen
                buddyList.appendString(''); // Real name
                buddyList.appendBoolean(false); // Offline messaging
                buddyList.appendBoolean(false);
                buddyList.appendBoolean(false);
                buddyList.appendShort(buddy.getRelation());
            }

            this.client.send(buddyList);
        }

        // If no friends, send empty list
        if (friendsList.length === 0) {
            const emptyList = new ServerMessage(Outgoing.BuddyListComposer);
            emptyList.appendInt(1);  // Pages
            emptyList.appendInt(0);  // Current page
            emptyList.appendInt(0);  // Friends count
            this.client.send(emptyList);
        }

        // Notify friends that we're online
        messenger.connectionChanged(true, habbo.isInRoom());
    }
}
