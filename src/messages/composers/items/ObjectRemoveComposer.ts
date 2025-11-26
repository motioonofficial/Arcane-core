/**
 * ObjectRemoveComposer - Notifies clients about a floor item removal
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class ObjectRemoveComposer {
    private itemId: number;
    private pickerId: number;
    private delay: number;

    constructor(itemId: number, pickerId: number = 0, delay: number = 0) {
        this.itemId = itemId;
        this.pickerId = pickerId;
        this.delay = delay;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.ObjectRemoveComposer);
        message.appendString(this.itemId.toString());
        message.appendBoolean(false); // Is expired
        message.appendInt(this.pickerId);
        message.appendInt(this.delay);
        return message;
    }
}
