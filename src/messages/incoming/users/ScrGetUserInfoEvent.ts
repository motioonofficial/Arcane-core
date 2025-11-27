/**
 * ScrGetUserInfoEvent - Get subscription/club info
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class ScrGetUserInfoEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send subscription info (HC/VIP status)
        const response = new ServerMessage(Outgoing.ScrSendUserInfoComposer);
        response.appendString('habbo_club'); // Product name
        response.appendInt(0);    // Days remaining
        response.appendInt(0);    // Months since last purchase
        response.appendInt(0);    // Months purchased
        response.appendInt(0);    // Months remaining
        response.appendBoolean(true); // Has ever been member
        response.appendBoolean(true); // Is VIP
        response.appendInt(0);    // Past VIP days
        response.appendInt(0);    // Minutes until expire

        this.client.send(response);
    }
}
