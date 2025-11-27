/**
 * GetAchievementsEvent - Get user achievements
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetAchievementsEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send empty achievements list
        const response = new ServerMessage(Outgoing.AchievementsComposer);
        response.appendInt(0);  // Achievements count
        response.appendString(''); // Default category

        this.client.send(response);
    }
}
