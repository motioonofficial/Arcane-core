/**
 * CompleteDiffieHandshakeEvent
 * Client sends their public key to complete DH exchange
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import type { DiffieHellman } from '../../../crypto/DiffieHellman';
import { config } from '../../../config/Configuration';

export class CompleteDiffieHandshakeEvent extends MessageHandler {
    public requiresLogin(): boolean {
        return false;
    }

    public handle(): void {
        // Read client's public key
        const clientPublicKey = this.packet.readString();

        // Get DH instance from client
        const dh = (this.client as { dh?: DiffieHellman }).dh;

        if (!dh) {
            this.client.disconnect('DH not initialized');
            return;
        }

        try {
            // Compute shared secret
            const sharedSecret = dh.computeSharedSecret(clientPublicKey);

            // Enable encryption if configured
            if (config.crypto.enabled) {
                this.client.enableEncryption(sharedSecret);
            }

            // Mark handshake as complete
            this.client.setHandshakeComplete(true);

            // Send completion response
            const response = new ServerMessage(Outgoing.CompleteDiffieHandshakeComposer);
            response.appendBoolean(config.crypto.enabled); // isEncrypted

            this.client.send(response);

        } catch (error) {
            this.client.disconnect('DH computation failed');
        }
    }
}
