/**
 * ObjectAddComposer - Notifies clients about a new floor item
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { RoomItem } from '../../../game/items/RoomItem';

export class ObjectAddComposer {
    private item: RoomItem;

    constructor(item: RoomItem) {
        this.item = item;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.ObjectAddComposer);
        this.item.serializeFloor(message);
        message.appendString(this.item.getOwnerName());
        return message;
    }
}
