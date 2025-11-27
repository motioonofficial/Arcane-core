/**
 * GetForumsListEvent - Get forums/groups list
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetForumsListEvent extends MessageHandler {
    public async handle(): Promise<void> {
        // Send empty forums list
        const response = new ServerMessage(Outgoing.ForumsListComposer);
        response.appendInt(0); // Mode
        response.appendInt(0); // Forums count
        response.appendInt(0); // Start index
        response.appendInt(0); // Total forums

        this.client.send(response);
    }
}
