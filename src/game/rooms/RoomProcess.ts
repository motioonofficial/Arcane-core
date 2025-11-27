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

                // Java: Sit/lay check runs BEFORE movement (cycleRoomUnit before cycle)
                // sitUpdate flag is set when path ends, checked on NEXT tick
                if (!roomUnit.isWalking() && roomUnit.needsSitUpdate()) {
                    this.logger.debug(`Sit update check at (${roomUnit.getX()},${roomUnit.getY()})`);
                    this.handleSitLayCheck(habbo);
                    roomUnit.setSitUpdate(false);
                    if (!usersToUpdate.includes(habbo)) {
                        usersToUpdate.push(habbo);
                    }
                }

                // Process movement - returns true if status changed
                const needsUpdate = roomUnit.processMovement();
                if (needsUpdate) {
                    usersToUpdate.push(habbo);
                    roomUnit.resetIdleTimer(); // Reset idle when moving
                }

                // Not moving - check idle
                if (!roomUnit.isWalking()) {
                    roomUnit.incrementIdleTimer();

                    // Send idle status when user becomes idle (like Java)
                    // IDLE_CYCLES = 240 ticks = ~120 seconds at 500ms
                    if (roomUnit.getIdleTimer() === 240 && !roomUnit.isDancing()) {
                        this.sendIdleStatus(habbo, true);
                    }

                    // Do random head look when idle (but not when sitting/laying)
                    if (roomUnit.isIdle() && !roomUnit.hasStatus(RoomUnitStatus.SIT) && !roomUnit.hasStatus(RoomUnitStatus.LAY)) {
                        const didLook = roomUnit.doRandomHeadLook();
                        if (didLook && !usersToUpdate.includes(habbo)) {
                            usersToUpdate.push(habbo);
                        }
                    }

                    // Update AFK motto every minute
                    if (roomUnit.isAfk()) {
                        this.updateAfkMotto(habbo);
                    }
                }

                // Check effect timeout
                if (roomUnit.getEffectId() > 0 && roomUnit.isEffectExpired()) {
                    this.removeEffect(habbo);
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

        if (state === RoomTileState.SIT) {
            // Get the tallest chair at this position (like Java getTallestChair)
            const chair = this.room.getTallestChair(x, y);
            if (chair) {
                // Set Z to chair's Z position
                roomUnit.setZ(chair.getZ());

                // Set rotation to chair rotation
                roomUnit.setRotation(chair.getRotation());

                // Set sit status with height
                roomUnit.setStatus(RoomUnitStatus.SIT, chair.getDefinition().getSitHeight().toFixed(2));
                roomUnit.setNeedsUpdate(true);
            }
        } else if (state === RoomTileState.LAY) {
            // Get the bed at this position
            const bed = this.room.getTopItemAt(x, y);
            if (bed && bed.getDefinition().canLay()) {
                roomUnit.setZ(bed.getZ());
                roomUnit.setRotation(bed.getRotation() % 4);
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
     * Update AFK motto with duration
     * Updates every 60 seconds (when minute changes)
     */
    private lastAfkUpdate: Map<number, number> = new Map();

    private updateAfkMotto(habbo: Habbo): void {
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit || !roomUnit.isAfk()) return;

        const currentMinute = roomUnit.getAfkMinutes();
        const lastMinute = this.lastAfkUpdate.get(habbo.getId()) ?? -1;

        // Only update if minute changed
        if (currentMinute === lastMinute) return;

        this.lastAfkUpdate.set(habbo.getId(), currentMinute);

        // Update motto
        const originalMotto = roomUnit.getOriginalMotto();
        const newMotto = `[AFK] ${currentMinute} dk - ${originalMotto}`;
        habbo.setMotto(newMotto);

        // Send motto update to room
        const response = new ServerMessage(Outgoing.RoomUserDataComposer);
        response.appendInt(1); // Count
        response.appendInt(habbo.getId());
        response.appendString(habbo.getLook());
        response.appendString(habbo.getGender());
        response.appendString(newMotto);
        response.appendInt(0); // Achievement score

        this.room.sendToAll(response);
    }

    /**
     * Send idle status to room (like Java RoomUnitIdleComposer)
     */
    private sendIdleStatus(habbo: Habbo, isIdle: boolean): void {
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        const response = new ServerMessage(Outgoing.RoomUnitIdleComposer);
        response.appendInt(roomUnit.getId());
        response.appendBoolean(isIdle);

        this.room.sendToAll(response);
    }

    /**
     * Remove effect from user (like Java)
     */
    private removeEffect(habbo: Habbo): void {
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        roomUnit.setEffectId(0);

        const response = new ServerMessage(Outgoing.AvatarEffectComposer);
        response.appendInt(roomUnit.getId());
        response.appendInt(0); // No effect
        response.appendInt(0); // Delay

        this.room.sendToAll(response);
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
