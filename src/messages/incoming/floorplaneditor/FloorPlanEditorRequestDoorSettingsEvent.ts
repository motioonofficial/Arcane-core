/**
 * FloorPlanEditorRequestDoorSettingsEvent - Client requests door settings for floor plan editor
 * Java: FloorPlanEditorRequestDoorSettingsEvent.java
 */

import { MessageHandler } from '../../MessageHandler';
import { FloorPlanEditorDoorSettingsComposer } from '../../composers/floorplaneditor/FloorPlanEditorDoorSettingsComposer';
import { RoomFloorThicknessUpdatedComposer } from '../../composers/floorplaneditor/RoomFloorThicknessUpdatedComposer';

export class FloorPlanEditorRequestDoorSettingsEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        // Send door settings
        this.client.send(new FloorPlanEditorDoorSettingsComposer(room).compose());

        // Send thickness settings
        this.client.send(new RoomFloorThicknessUpdatedComposer(room).compose());
    }

    public getRateLimit(): number {
        return 500;
    }
}
