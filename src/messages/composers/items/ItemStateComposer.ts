/**
 * ItemStateComposer - Sends state-only update for furniture (non-limited items)
 * Java: ItemStateComposer.java
 *
 * Used when only the item's state/extradata changes, not position.
 * Much lighter than ObjectUpdateComposer.
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { RoomItem } from '../../../game/items/RoomItem';

export class ItemStateComposer {
    private item: RoomItem;

    constructor(item: RoomItem) {
        this.item = item;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.ItemStateComposer);
        message.appendInt(this.item.getId());

        // Send state as integer
        try {
            const state = parseInt(this.item.getExtraData()) || 0;
            message.appendInt(state);
        } catch {
            message.appendInt(0);
        }

        return message;
    }
}
