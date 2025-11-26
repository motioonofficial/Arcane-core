/**
 * FloorPlanEditorDoorSettingsComposer - Send door position for floor plan editor
 * Java: FloorPlanEditorDoorSettingsComposer.java
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { Room } from '../../../game/rooms/Room';

export class FloorPlanEditorDoorSettingsComposer {
    private room: Room;

    constructor(room: Room) {
        this.room = room;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.FloorPlanEditorDoorSettingsComposer);
        const layout = this.room.getLayout();

        message.appendInt(layout?.getDoorX() || 0);
        message.appendInt(layout?.getDoorY() || 0);
        message.appendInt(layout?.getDoorDirection() || 2);

        return message;
    }
}
