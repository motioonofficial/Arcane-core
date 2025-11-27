/**
 * GetHabboClubDataEvent - Get Habbo Club membership data
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetHabboClubDataEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send HC subscription info
        const response = new ServerMessage(Outgoing.HabboClubSubscriptionComposer);
        response.appendString('habbo_club'); // Product name
        response.appendInt(0);    // Days remaining
        response.appendInt(0);    // Months elapsed
        response.appendInt(0);    // Months prepaid
        response.appendInt(0);    // Response type
        response.appendBoolean(true); // Has ever been member
        response.appendBoolean(true); // Is VIP
        response.appendInt(0);    // Past club days
        response.appendInt(0);    // Remaining minutes

        this.client.send(response);
    }
}
