/**
 * RoomUserSignEvent - Handle user sign request (shows sign above head)
 */

import { MessageHandler } from '../../../MessageHandler';
import { ServerMessage } from '../../../ServerMessage';
import { Outgoing } from '../../../Headers';

// Sign Composer header (different from carry object)
const SIGN_COMPOSER = 1170; // RoomUserSignComposer - check your headers

export class RoomUserSignEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit || !roomUnit.isInRoom()) return;

        const signId = this.packet.readInt();

        // Validate sign ID (0-17)
        // 0-10 = numbers, 11 = heart, 12 = skull, 13 = exclamation, etc.
        if (signId < 0 || signId > 17) return;

        // Reset idle timer
        roomUnit.resetIdleTimer();

        // If was idle, send un-idle
        if (roomUnit.isIdle()) {
            const idlePacket = new ServerMessage(Outgoing.RoomUnitIdleComposer);
            idlePacket.appendInt(roomUnit.getId());
            idlePacket.appendBoolean(false); // Not idle
            room.sendToAll(idlePacket);
        }

        // Set sign status - will be sent in status update
        // Sign status format: "sign X" where X is sign ID
        roomUnit.setStatus('sign', signId.toString());
        roomUnit.setNeedsUpdate(true);

        // Auto-remove sign after ~5 seconds (10 ticks at 500ms)
        setTimeout(() => {
            if (roomUnit.hasStatus('sign')) {
                roomUnit.removeStatus('sign');
                roomUnit.setNeedsUpdate(true);
            }
        }, 5000);
    }
}
