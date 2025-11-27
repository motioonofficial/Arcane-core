/**
 * MessengerInitEvent - Initialize messenger (friends list)
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class MessengerInitEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send messenger init
        const init = new ServerMessage(Outgoing.MessengerInitComposer);
        init.appendInt(300); // Max friends user can have
        init.appendInt(300); // Default max
        init.appendInt(800); // Max friends extended (VIP)
        init.appendInt(0);   // Friend categories count
        this.client.send(init);

        // Send empty friends list
        const friends = new ServerMessage(Outgoing.BuddyListComposer);
        friends.appendInt(1);  // Pages
        friends.appendInt(0);  // Current page
        friends.appendInt(0);  // Friends count
        this.client.send(friends);

        // Send empty friend requests
        const requests = new ServerMessage(Outgoing.BuddyRequestsComposer);
        requests.appendInt(0); // Total requests
        requests.appendInt(0); // Requests count
        this.client.send(requests);
    }
}
