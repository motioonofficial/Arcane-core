/**
 * RoomWallItemsComposer - Sends wall items in a room
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { WallItem } from '../../../game/items/WallItem';

export class RoomWallItemsComposer {
    private items: WallItem[];
    private ownerNames: Map<number, string>;

    constructor(items: WallItem[]) {
        this.items = items;
        this.ownerNames = new Map();

        // Collect unique owner names
        for (const item of items) {
            if (!this.ownerNames.has(item.getOwnerId())) {
                this.ownerNames.set(item.getOwnerId(), item.getOwnerName());
            }
        }
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.RoomWallItemsComposer);

        // Owner names
        message.appendInt(this.ownerNames.size);
        for (const [ownerId, ownerName] of this.ownerNames) {
            message.appendInt(ownerId);
            message.appendString(ownerName);
        }

        // Items
        message.appendInt(this.items.length);
        for (const item of this.items) {
            item.serialize(message);
        }

        return message;
    }
}
