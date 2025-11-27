/**
 * RoomUserWalkEvent - Handles user walk requests
 * Client sends this when user clicks on a tile to walk to
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';
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

        // Teleport mode - instant movement
        if (roomUnit.isTeleporting()) {
            // Clear any current walking
            roomUnit.stopWalking();

            // Get target height
            const targetZ = targetTile.getStackHeight();

            // Set position directly (updates both current and previous - no animation)
            roomUnit.setPosition(targetX, targetY, targetZ);

            // Calculate rotation towards target
            const rotation = Pathfinder.calculateRotation(roomUnit.getPreviousX(), roomUnit.getPreviousY(), targetX, targetY);
            roomUnit.setRotation(rotation);

            // Mark for status update
            roomUnit.setNeedsUpdate(true);

            this.logger.movement(habbo.getId(), habbo.getUsername(), {
                fromX: roomUnit.getPreviousX(),
                fromY: roomUnit.getPreviousY(),
                toX: targetX,
                toY: targetY,
                action: 'TELEPORT'
            });
            return;
        }

        // Find path (now uses Room for furniture checks)
        const path = Pathfinder.findPath(
            room,
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

        // If user was AFK, disable AFK mode
        if (roomUnit.isAfk()) {
            roomUnit.setAfk(false);

            // Restore original motto
            const originalMotto = roomUnit.getOriginalMotto();
            habbo.setMotto(originalMotto);

            // Send motto update
            const response = new ServerMessage(Outgoing.RoomUserDataComposer);
            response.appendInt(1);
            response.appendInt(habbo.getId());
            response.appendString(habbo.getLook());
            response.appendString(habbo.getGender());
            response.appendString(originalMotto);
            response.appendInt(0);
            room.sendToAll(response);

            // Remove idle effect
            const effect = new ServerMessage(Outgoing.AvatarEffectComposer);
            effect.appendInt(roomUnit.getId());
            effect.appendInt(0);
            effect.appendInt(0);
            room.sendToAll(effect);
        }
    }
}
