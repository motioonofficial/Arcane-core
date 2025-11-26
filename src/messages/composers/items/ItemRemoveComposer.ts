/**
 * ItemRemoveComposer - Notifies clients about a wall item removal
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class ItemRemoveComposer {
    private itemId: number;
    private pickerId: number;

    constructor(itemId: number, pickerId: number = 0) {
        this.itemId = itemId;
        this.pickerId = pickerId;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.ItemRemoveComposer);
        message.appendString(this.itemId.toString());
        message.appendInt(this.pickerId);
        return message;
    }
}
