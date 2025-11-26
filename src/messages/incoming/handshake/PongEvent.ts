/**
 * PongEvent
 * Client responds to ping
 */

import { MessageHandler } from '../../MessageHandler';

export class PongEvent extends MessageHandler {
    public requiresLogin(): boolean {
        return false;
    }

    public handle(): void {
        // Client responded to ping, connection is alive
        // No response needed
    }
}
