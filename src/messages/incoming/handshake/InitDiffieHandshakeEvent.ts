/**
 * InitDiffieHandshakeEvent
 * First packet sent by client to initiate Diffie-Hellman key exchange
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { DiffieHellman } from '../../../crypto/DiffieHellman';

export class InitDiffieHandshakeEvent extends MessageHandler {
    public requiresLogin(): boolean {
        return false;
    }

    public handle(): void {
        // Create DH instance for this client
        const dh = new DiffieHellman();

        // Store DH instance in client for later (we'll add this to GameClient)
        (this.client as { dh?: DiffieHellman }).dh = dh;

        // Send DH parameters to client
        const response = new ServerMessage(Outgoing.InitDiffieHandshakeComposer);
        response.appendString(dh.getPublicKey());
        response.appendString(dh.getPrime());
        response.appendString(dh.getGenerator());

        this.client.send(response);
    }
}
