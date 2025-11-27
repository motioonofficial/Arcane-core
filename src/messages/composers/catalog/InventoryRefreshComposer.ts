/**
 * InventoryRefreshComposer - Tells client to refresh inventory
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class InventoryRefreshComposer {
    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.FurniListInvalidateComposer);
        return message;
    }
}
