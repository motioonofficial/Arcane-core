/**
 * RoomProcess - Handles room cycle/tick processing
 * Processes all room units (movement, statuses, etc.)
 */

import { Room } from './Room';
import { RoomTileState } from './RoomLayout';
import { RoomUnitStatus } from './RoomUnit';
import { ServerMessage } from '../../messages/ServerMessage';
import { Outgoing } from '../../messages/Headers';
import { Logger } from '../../utils/Logger';
import type { Habbo } from '../users/Habbo';

export class RoomProcess {
    private static readonly TICK_INTERVAL = 500; // 500ms - standard Habbo timing
    private logger = new Logger('RoomProcess');
    private room: Room;
    private interval: Timer | null = null;
    private running: boolean = false;

    constructor(room: Room) {
        this.room = room;
    }

    public start(): void {
        if (this.running) return;

        this.running = true;
        this.interval = setInterval(() => this.cycle(), RoomProcess.TICK_INTERVAL);
    }

    public stop(): void {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    public isRunning(): boolean {
        return this.running;
    }

    /**
     * Main room cycle - processes all room units
     * Runs every TICK_INTERVAL ms (480ms for smooth Habbo-like movement)
     */
    private cycle(): void {
        if (!this.running) return;

        try {
            const usersToUpdate: Habbo[] = [];

            // Process all users in room
            for (const habbo of this.room.getHabbos()) {
                const roomUnit = habbo.getRoomUnit();
                if (!roomUnit) continue;

                // Check if user just finished walking (for sit/lay check)
                const wasWalking = roomUnit.isWalking();

                // Process movement - returns true if status changed
                const needsUpdate = roomUnit.processMovement();
                if (needsUpdate) {
                    usersToUpdate.push(habbo);
                    roomUnit.resetIdleTimer(); // Reset idle when moving
                }

                // Check for sit/lay when user stops walking (like Java sitUpdate)
                const stoppedWalking = wasWalking && !roomUnit.isWalking();
                if (stoppedWalking) {
                    this.handleSitLayCheck(habbo);
                    if (!usersToUpdate.includes(habbo)) {
                        usersToUpdate.push(habbo);
                    }
                }

                // Not moving - check idle
                if (!roomUnit.isWalking()) {
                    roomUnit.incrementIdleTimer();

                    // Do random head look when idle (but not when sitting/laying)
                    if (roomUnit.isIdle() && !roomUnit.hasStatus(RoomUnitStatus.SIT) && !roomUnit.hasStatus(RoomUnitStatus.LAY)) {
                        const didLook = roomUnit.doRandomHeadLook();
                        if (didLook && !usersToUpdate.includes(habbo)) {
                            usersToUpdate.push(habbo);
                        }
                    }
                }

                // Check if unit needs manual update (e.g., after stopping)
                if (roomUnit.needsStatusUpdate()) {
                    if (!usersToUpdate.includes(habbo)) {
                        usersToUpdate.push(habbo);
                    }
                    roomUnit.setNeedsUpdate(false);
                }
            }

            // Send status updates for all users that need it
            if (usersToUpdate.length > 0) {
                this.sendStatusUpdate(usersToUpdate);
            }
        } catch (error) {
            this.logger.error('Error in room cycle:', error);
        }
    }

    /**
     * Check if user should sit or lay after stopping movement
     * Java: Room.cycleRoomUnit() - checks tile state and sets SIT/LAY status
     */
    private handleSitLayCheck(habbo: Habbo): void {
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        const x = roomUnit.getX();
        const y = roomUnit.getY();

        const layout = this.room.getLayout();
        if (!layout) return;

        const tile = layout.getTile(x, y);
        if (!tile) return;

        const state = tile.getState();

        this.logger.debug(`SitLayCheck: User at (${x},${y}) tile state: ${RoomTileState[state]}`);

        if (state === RoomTileState.SIT) {
            // Get the tallest chair at this position (like Java getTallestChair)
            const chair = this.room.getTallestChair(x, y);
            if (chair) {
                this.logger.debug(`Found chair at (${chair.getX()},${chair.getY()}) Z:${chair.getZ()} height:${chair.getDefinition().getSitHeight()}`);

                // Set Z to chair's Z position (like Java: unit.setZ(topItem.getZ()))
                roomUnit.setZ(chair.getZ());

                // Set rotation to chair rotation (chairs have 4 directions: 0, 2, 4, 6)
                roomUnit.setRotation(chair.getRotation());

                // Set sit status with height (like Java: Item.getCurrentHeight(topItem))
                roomUnit.setStatus(RoomUnitStatus.SIT, chair.getDefinition().getSitHeight().toFixed(2));
                roomUnit.setNeedsUpdate(true);

                this.logger.debug(`User now sitting, Z:${roomUnit.getZ()} rot:${roomUnit.getBodyRotation()}`);
            } else {
                this.logger.debug(`No chair found at user position!`);
            }
        } else if (state === RoomTileState.LAY) {
            // Get the bed at this position
            const bed = this.room.getTopItemAt(x, y);
            if (bed && bed.getDefinition().canLay()) {
                this.logger.debug(`Found bed at (${bed.getX()},${bed.getY()}) Z:${bed.getZ()}`);

                roomUnit.setZ(bed.getZ());

                // For beds, rotation is along the bed length (0 or 2)
                roomUnit.setRotation(bed.getRotation() % 4);

                // Set lay status
                roomUnit.setStatus(RoomUnitStatus.LAY, bed.getDefinition().getSitHeight().toFixed(2));
                roomUnit.setNeedsUpdate(true);
            }
        } else if (state === RoomTileState.OPEN) {
            // If user was sitting/laying but tile is now OPEN, stand up
            if (roomUnit.hasStatus(RoomUnitStatus.SIT)) {
                roomUnit.removeStatus(RoomUnitStatus.SIT);
                roomUnit.setNeedsUpdate(true);
            }
            if (roomUnit.hasStatus(RoomUnitStatus.LAY)) {
                roomUnit.removeStatus(RoomUnitStatus.LAY);
                roomUnit.setNeedsUpdate(true);
            }
        }
    }

    /**
     * Send RoomUserStatusComposer for updated users
     *
     * IMPORTANT: Like Java emulator, we send PREVIOUS position with MOVE status
     * containing the TARGET position. Client interpolates from previous to target.
     * After sending, we update previousLocation = currentLocation
     */
    private sendStatusUpdate(habbos: any[]): void {
        const response = new ServerMessage(Outgoing.RoomUserStatusComposer);
        response.appendInt(habbos.length);

        for (const habbo of habbos) {
            const unit = habbo.getRoomUnit();
            if (!unit) continue;

            response.appendInt(unit.getId());

            // Always send previous position (client animates FROM here)
            response.appendInt(unit.getPreviousX());
            response.appendInt(unit.getPreviousY());
            response.appendString(unit.getPreviousZ().toString());

            response.appendInt(unit.getHeadRotation());
            response.appendInt(unit.getBodyRotation());

            // Status string contains MOVE with target position
            response.appendString(unit.getStatusString());

            // After sending, sync previous to current (like Java)
            unit.syncPreviousLocation();
        }

        // Send to all users in room
        this.room.sendToAll(response);
    }
}
