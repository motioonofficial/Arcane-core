/**
 * RoomUserWalkEvent - Handles user walk requests
 * Client sends this when user clicks on a tile to walk to
 */

import { MessageHandler } from '../../../MessageHandler';
import { Pathfinder } from '../../../../game/rooms/Pathfinder';
import { Logger } from '../../../../utils/Logger';

export class RoomUserWalkEvent extends MessageHandler {
    private logger = new Logger('RoomUserWalkEvent');

    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit || !roomUnit.isInRoom()) return;

        // Check if user can walk
        if (!roomUnit.canUserWalk()) return;

        // Read target coordinates
        const targetX = this.packet.readInt();
        const targetY = this.packet.readInt();

        // Validate coordinates
        const layout = room.getLayout();
        if (!layout) return;

        const targetTile = layout.getTile(targetX, targetY);
        if (!targetTile) return;

        // Already at target
        if (roomUnit.getX() === targetX && roomUnit.getY() === targetY) {
            return;
        }

        // Find path
        const path = Pathfinder.findPath(
            layout,
            roomUnit.getX(),
            roomUnit.getY(),
            targetX,
            targetY,
            true // Allow diagonal
        );

        if (path.length === 0) {
            // No valid path found
            this.logger.movement(habbo.getId(), habbo.getUsername(), {
                fromX: roomUnit.getX(),
                fromY: roomUnit.getY(),
                toX: targetX,
                toY: targetY,
                action: 'PATH_NOT_FOUND'
            });
            return;
        }

        // Log movement start
        this.logger.movement(habbo.getId(), habbo.getUsername(), {
            fromX: roomUnit.getX(),
            fromY: roomUnit.getY(),
            toX: targetX,
            toY: targetY,
            pathLength: path.length,
            action: 'WALK_START'
        });

        // Set goal and path
        roomUnit.setGoal(targetX, targetY);
        roomUnit.setPath(path);
    }
}
