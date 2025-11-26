/**
 * ObjectUpdateComposer - Notifies clients about a floor item update (move/rotate)
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { RoomItem } from '../../../game/items/RoomItem';

export class ObjectUpdateComposer {
    private item: RoomItem;

    constructor(item: RoomItem) {
        this.item = item;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.ObjectUpdateComposer);
        this.item.serializeFloor(message);
        message.appendString(this.item.getOwnerName());
        return message;
    }
}
