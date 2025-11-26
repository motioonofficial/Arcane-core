/**
 * ObjectDataUpdateComposer - Updates floor item extra data (state change)
 */

import { ServerMessage } from '../../ServerMessage';
import type { RoomItem } from '../../../game/items/RoomItem';

export class ObjectDataUpdateComposer {
    private item: RoomItem;

    constructor(item: RoomItem) {
        this.item = item;
    }

    public compose(): ServerMessage {
        // Using a different approach - direct state update
        const message = new ServerMessage(3776); // ObjectUpdateComposer header
        message.appendString(this.item.getId().toString());
        message.appendInt(0); // Category
        message.appendString(this.item.getExtraData());
        return message;
    }
}
