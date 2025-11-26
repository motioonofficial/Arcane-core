/**
 * ItemAddComposer - Notifies clients about a new wall item
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { WallItem } from '../../../game/items/WallItem';

export class ItemAddComposer {
    private item: WallItem;

    constructor(item: WallItem) {
        this.item = item;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.ItemAddComposer);
        this.item.serialize(message);
        message.appendString(this.item.getOwnerName());
        return message;
    }
}
