/**
 * GetMOTDEvent - Get Message of the Day
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetMOTDEvent extends MessageHandler {
    public async handle(): Promise<void> {
        // Send empty MOTD (no message of the day)
        const response = new ServerMessage(Outgoing.MOTDNotificationComposer);
        response.appendInt(0); // Messages count

        this.client.send(response);
    }
}
