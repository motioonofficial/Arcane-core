/**
 * RequestWearingBadgesEvent - Get user's wearing badges
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class RequestWearingBadgesEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const userId = this.packet.readInt();
        if (userId <= 0) return;

        // For now, send empty badges (no badge system yet)
        const response = new ServerMessage(Outgoing.UserWearingBadgesComposer);
        response.appendInt(userId);
        response.appendInt(0); // Badge count

        this.client.send(response);
    }
}
