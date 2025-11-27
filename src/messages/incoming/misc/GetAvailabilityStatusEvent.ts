/**
 * GetAvailabilityStatusEvent - Get hotel availability status
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetAvailabilityStatusEvent extends MessageHandler {
    public async handle(): Promise<void> {
        // Send availability status (hotel is open)
        const response = new ServerMessage(Outgoing.AvailabilityStatusComposer);
        response.appendBoolean(true);  // Is open
        response.appendBoolean(false); // Is closing
        response.appendBoolean(true);  // Is open for authenticated

        this.client.send(response);
    }
}
