/**
 * ClientVariablesEvent
 * Client sends version and other variables
 */

import { MessageHandler } from '../../MessageHandler';

export class ClientVariablesEvent extends MessageHandler {
    public requiresLogin(): boolean {
        return false;
    }

    public handle(): void {
        const gordanPath = this.packet.readInt();
        const externalVariablesPath = this.packet.readString();

        // Just acknowledge, no response needed
    }
}
