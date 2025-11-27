/**
 * GetRelationshipsEvent - Get user relationships (hearts, smiles, skulls)
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetRelationshipsEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send empty relationships
        const response = new ServerMessage(Outgoing.RelationshipsComposer);
        response.appendInt(habbo.getId()); // User ID
        response.appendInt(0); // Relationships count

        this.client.send(response);
    }
}
