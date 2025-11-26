/**
 * ReleaseVersionEvent
 * Nitro sends client version info
 */

import { MessageHandler } from '../../MessageHandler';

export class ReleaseVersionEvent extends MessageHandler {
    public requiresLogin(): boolean {
        return false;
    }

    public handle(): void {
        const releaseVersion = this.packet.readString();
        const type = this.packet.readString();
        const platform = this.packet.readInt();
        const category = this.packet.readInt();

        // Just acknowledge, version check can be added later
    }
}
