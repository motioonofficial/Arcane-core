/**
 * RoomUserLookAtEvent - User looks at a position/user
 * Rotates head (and body if needed) towards target
 */

import { MessageHandler } from '../../../MessageHandler';

export class RoomUserLookAtEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const room = habbo.getCurrentRoom();
        if (!room) return;

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit || !roomUnit.isInRoom()) return;

        // Can't look while walking or sitting/laying
        if (roomUnit.isWalking()) return;
        if (roomUnit.hasStatus('sit') || roomUnit.hasStatus('lay')) return;

        // Read target position
        const targetX = this.packet.readInt();
        const targetY = this.packet.readInt();

        // Use the lookAt method which handles all rotation logic
        roomUnit.lookAt(targetX, targetY);

        // Reset idle timer (user is active)
        roomUnit.resetIdleTimer();
    }
}
