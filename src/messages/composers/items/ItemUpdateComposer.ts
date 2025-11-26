/**
 * ItemUpdateComposer - Notifies clients about a wall item update
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { WallItem } from '../../../game/items/WallItem';

export class ItemUpdateComposer {
    private item: WallItem;

    constructor(item: WallItem) {
        this.item = item;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.ItemUpdateComposer);
        this.item.serialize(message);
        message.appendString(this.item.getOwnerName());
        return message;
    }
}
