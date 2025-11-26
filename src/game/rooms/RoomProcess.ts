/**
 * RoomProcess - Handles room cycle/tick processing
 * Processes all room units (movement, statuses, etc.)
 */

import { Room } from './Room';
import { ServerMessage } from '../../messages/ServerMessage';
import { Outgoing } from '../../messages/Headers';
import { Logger } from '../../utils/Logger';

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
            const usersToUpdate: any[] = [];

            // Process all users in room
            for (const habbo of this.room.getHabbos()) {
                const roomUnit = habbo.getRoomUnit();
                if (!roomUnit) continue;

                // Process movement - returns true if status changed
                const needsUpdate = roomUnit.processMovement();
                if (needsUpdate) {
                    usersToUpdate.push(habbo);
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
