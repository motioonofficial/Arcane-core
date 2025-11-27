/**
 * GetClubGiftInfoEvent - Get club gift info
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetClubGiftInfoEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send club gift info
        const response = new ServerMessage(Outgoing.ClubGiftInfoComposer);
        response.appendInt(0);  // Days until next gift
        response.appendInt(0);  // Available gifts count
        response.appendInt(0);  // Gifts data count
        response.appendInt(0);  // Gift offers count

        this.client.send(response);
    }
}
