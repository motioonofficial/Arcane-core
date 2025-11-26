/**
 * FloorPlanEditorRequestBlockedTilesEvent - Client requests blocked tiles for floor plan editor
 * Java: FloorPlanEditorRequestBlockedTilesEvent.java
 */

import { MessageHandler } from '../../MessageHandler';
import { FloorPlanEditorBlockedTilesComposer } from '../../composers/floorplaneditor/FloorPlanEditorBlockedTilesComposer';

export class FloorPlanEditorRequestBlockedTilesEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        // Send blocked tiles
        this.client.send(new FloorPlanEditorBlockedTilesComposer(room).compose());
    }

    public getRateLimit(): number {
        return 500;
    }
}
