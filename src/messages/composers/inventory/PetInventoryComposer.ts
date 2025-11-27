/**
 * PetInventoryComposer - Sends user's pet inventory
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class PetInventoryComposer {
    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.PetInventoryComposer);

        // Empty pet list for now
        message.appendInt(1); // Total fragments
        message.appendInt(0); // Current fragment
        message.appendInt(0); // Pet count

        return message;
    }
}
