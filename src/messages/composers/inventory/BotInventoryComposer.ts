/**
 * BotInventoryComposer - Sends user's bot inventory
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class BotInventoryComposer {
    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.BotInventoryComposer);

        // Empty bot list for now
        message.appendInt(0); // Bot count

        return message;
    }
}
