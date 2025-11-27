/**
 * GetIgnoredUsersEvent - Get list of ignored users
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetIgnoredUsersEvent extends MessageHandler {
    public async handle(): Promise<void> {
        // Send empty ignored users list
        const response = new ServerMessage(Outgoing.IgnoredUsersComposer);
        response.appendInt(0); // Ignored users count

        this.client.send(response);
    }
}
