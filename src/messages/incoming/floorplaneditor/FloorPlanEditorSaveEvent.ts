/**
 * FloorPlanEditorSaveEvent - Save custom floor plan
 * Java: FloorPlanEditorSaveEvent.java
 */

import { MessageHandler } from '../../MessageHandler';
import { Logger } from '../../../utils/Logger';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { game } from '../../../game/GameEnvironment';
import { RoomLayout } from '../../../game/rooms/RoomLayout';

export class FloorPlanEditorSaveEvent extends MessageHandler {
    private logger = new Logger('FloorPlanEditorSaveEvent');

    private static readonly MAXIMUM_FLOORPLAN_WIDTH_LENGTH = 64;
    private static readonly MAXIMUM_FLOORPLAN_SIZE = 64 * 64;

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        // Only room owner can edit floor plan
        if (room.getOwnerId() !== habbo.getId()) {
            this.logger.debug(`User ${habbo.getUsername()} is not room owner`);
            return;
        }

        // Read floor plan data
        let heightmap = this.packet.readString();
        heightmap = heightmap.replace(/X/g, 'x'); // Normalize

        const mapRows = heightmap.split('\r');
        const firstRowSize = mapRows[0]?.length || 0;

        // Validate heightmap
        const errors: string[] = [];

        // Check for valid characters
        if (!/^[a-zA-Z0-9\r]+$/.test(heightmap)) {
            errors.push('Invalid characters in heightmap');
        }

        // Check all rows are same length
        for (let i = 0; i < mapRows.length; i++) {
            if (mapRows[i].length !== firstRowSize) {
                errors.push(`Line ${i + 1} is different length than line 1`);
                break;
            }
        }

        // Check not empty
        if (heightmap.length === 0 || heightmap.replace(/x/g, '').replace(/\r/g, '').length === 0) {
            errors.push('Heightmap has no walkable tiles');
        }

        // Check size limits
        if (heightmap.length > FloorPlanEditorSaveEvent.MAXIMUM_FLOORPLAN_SIZE) {
            errors.push('Heightmap too large');
        }

        if (mapRows.length > FloorPlanEditorSaveEvent.MAXIMUM_FLOORPLAN_WIDTH_LENGTH) {
            errors.push('Heightmap height too large');
        }

        if (firstRowSize > FloorPlanEditorSaveEvent.MAXIMUM_FLOORPLAN_WIDTH_LENGTH) {
            errors.push('Heightmap width too large');
        }

        // Read door position
        const doorX = this.packet.readInt();
        const doorY = this.packet.readInt();

        // Validate door position
        if (doorX < 0 || doorX >= firstRowSize || doorY < 0 || doorY >= mapRows.length) {
            errors.push('Door position outside map');
        }

        // Check door is on valid tile
        if (doorY < mapRows.length && doorX < mapRows[doorY].length) {
            if (mapRows[doorY].charAt(doorX).toLowerCase() === 'x') {
                errors.push('Door not on valid tile');
            }
        }

        const doorDirection = this.packet.readInt();
        if (doorDirection < 0 || doorDirection > 7) {
            errors.push('Invalid door direction');
        }

        // Read thickness settings
        const wallSize = this.packet.readInt();
        if (wallSize < -2 || wallSize > 1) {
            errors.push('Invalid wall thickness');
        }

        const floorSize = this.packet.readInt();
        if (floorSize < -2 || floorSize > 1) {
            errors.push('Invalid floor thickness');
        }

        // Wall height (optional)
        let wallHeight = -1;
        if (this.packet.getRemainingLength() >= 4) {
            wallHeight = this.packet.readInt();
        }
        if (wallHeight < -1 || wallHeight > 15) {
            errors.push('Invalid wall height');
        }

        // Check for blocked tiles (tiles with items)
        const itemManager = room.getItemManager();
        if (itemManager) {
            const floorItems = itemManager.getFloorItems();
            for (const item of floorItems) {
                const x = item.getX();
                const y = item.getY();

                // Check if tile is being set to 'x' (blocked)
                if (y < mapRows.length && x < mapRows[y].length) {
                    const newChar = mapRows[y].charAt(x).toLowerCase();
                    if (newChar === 'x') {
                        errors.push('Cannot block tile with item on it');
                        break;
                    }
                }
            }
        }

        if (errors.length > 0) {
            this.logger.warn(`Floor plan validation failed: ${errors.join(', ')}`);
            this.sendError(errors[0]);
            return;
        }

        // Save the floor plan
        const roomManager = game.getRoomManager();
        const success = await roomManager.saveCustomLayout(
            room.getId(),
            doorX,
            doorY,
            doorDirection,
            heightmap
        );

        if (!success) {
            this.logger.error(`Failed to save floor plan for room ${room.getId()}`);
            this.sendError('Failed to save floor plan');
            return;
        }

        // Update room thickness settings
        await this.updateRoomThickness(room.getId(), wallSize, floorSize, wallHeight);

        this.logger.info(`Floor plan saved for room ${room.getId()} by ${habbo.getUsername()}`);

        // Forward all users to reload the room
        const habbos = [...room.getHabbos()];
        const forwardMsg = new ServerMessage(Outgoing.GetGuestRoomResultComposer);
        forwardMsg.appendBoolean(false); // Not loading
        forwardMsg.appendInt(room.getId());

        for (const roomHabbo of habbos) {
            // Send forward to room message
            const closeMsg = new ServerMessage(Outgoing.CloseConnectionComposer);
            roomHabbo.getClient().send(closeMsg);

            // Remove from room
            room.removeHabbo(roomHabbo);
        }

        // Dispose and reload room
        roomManager.disposeRoom(room.getId());
    }

    private async updateRoomThickness(roomId: number, wallSize: number, floorSize: number, wallHeight: number): Promise<void> {
        const { emulator } = await import('../../../core/Emulator');
        const db = emulator.getDatabase();

        await db.execute(
            `UPDATE rooms SET thickness_wall = ?, thickness_floor = ?, wall_height = ? WHERE id = ?`,
            [wallSize, floorSize, wallHeight, roomId]
        );
    }

    private sendError(message: string): void {
        // Send bubble alert or generic error
        const response = new ServerMessage(Outgoing.GenericErrorComposer);
        response.appendInt(-1);
        this.client.send(response);
    }

    public getRateLimit(): number {
        return 2000;
    }
}
