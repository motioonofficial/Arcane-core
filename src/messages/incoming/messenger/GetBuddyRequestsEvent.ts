/**
 * GetBuddyRequestsEvent - Get pending friend requests
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetBuddyRequestsEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send empty friend requests
        const response = new ServerMessage(Outgoing.BuddyRequestsComposer);
        response.appendInt(0); // Total requests
        response.appendInt(0); // Requests on this page

        this.client.send(response);
    }
}
