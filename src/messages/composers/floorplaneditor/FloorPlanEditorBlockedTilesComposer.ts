/**
 * FloorPlanEditorBlockedTilesComposer - Send blocked tiles (tiles with items)
 * Java: FloorPlanEditorBlockedTilesComposer.java
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { Room } from '../../../game/rooms/Room';

export class FloorPlanEditorBlockedTilesComposer {
    private room: Room;

    constructor(room: Room) {
        this.room = room;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.FloorPlanEditorBlockedTilesComposer);

        // Get locked/blocked tiles (tiles with items on them)
        const lockedTiles = this.getLockedTiles();

        message.appendInt(lockedTiles.length);
        for (const tile of lockedTiles) {
            message.appendInt(tile.x);
            message.appendInt(tile.y);
        }

        return message;
    }

    private getLockedTiles(): { x: number; y: number }[] {
        const lockedTiles: { x: number; y: number }[] = [];
        const itemManager = this.room.getItemManager();

        if (!itemManager) {
            return lockedTiles;
        }

        // Get all floor items and mark their tiles as locked
        const floorItems = itemManager.getFloorItems();
        const tileSet = new Set<string>();

        for (const item of floorItems) {
            const key = `${item.getX()},${item.getY()}`;
            if (!tileSet.has(key)) {
                tileSet.add(key);
                lockedTiles.push({ x: item.getX(), y: item.getY() });
            }

            // Also add tiles for item dimensions (width/length)
            const def = item.getDefinition();
            const width = def.getWidth();
            const length = def.getLength();
            const rotation = item.getRotation();

            // Calculate affected tiles based on rotation
            const effectiveWidth = (rotation === 0 || rotation === 4) ? width : length;
            const effectiveLength = (rotation === 0 || rotation === 4) ? length : width;

            for (let dx = 0; dx < effectiveWidth; dx++) {
                for (let dy = 0; dy < effectiveLength; dy++) {
                    const tileX = item.getX() + dx;
                    const tileY = item.getY() + dy;
                    const tileKey = `${tileX},${tileY}`;

                    if (!tileSet.has(tileKey)) {
                        tileSet.add(tileKey);
                        lockedTiles.push({ x: tileX, y: tileY });
                    }
                }
            }
        }

        return lockedTiles;
    }
}
