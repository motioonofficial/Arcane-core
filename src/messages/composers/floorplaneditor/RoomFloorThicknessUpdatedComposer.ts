/**
 * RoomFloorThicknessUpdatedComposer - Send room thickness settings
 * Java: RoomFloorThicknessUpdatedComposer.java
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { Room } from '../../../game/rooms/Room';

export class RoomFloorThicknessUpdatedComposer {
    private room: Room;

    constructor(room: Room) {
        this.room = room;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.RoomFloorThicknessUpdatedComposer);
        const data = this.room.getData();

        message.appendBoolean(data.hideWall);
        message.appendInt(data.wallThickness);
        message.appendInt(data.floorThickness);

        return message;
    }
}
