/**
 * GetUserFlatCatsEvent - Get user's room categories
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetUserFlatCatsEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send room categories
        const response = new ServerMessage(Outgoing.RoomCategoriesComposer);
        response.appendInt(0); // Categories count (no custom categories)

        this.client.send(response);
    }
}
