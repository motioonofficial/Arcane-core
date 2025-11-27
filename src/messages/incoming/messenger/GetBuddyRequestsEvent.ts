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

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        const requests = messenger.getFriendRequests();
        const requestsArray = Array.from(requests);

        const response = new ServerMessage(Outgoing.BuddyRequestsComposer);
        response.appendInt(requestsArray.length); // Total requests
        response.appendInt(requestsArray.length); // Requests count

        for (const request of requestsArray) {
            response.appendInt(request.getId());
            response.appendString(request.getUsername());
            response.appendString(request.getLook());
        }

        this.client.send(response);
    }
}
