/**
 * UniqueIdEvent
 * Client sends their machine ID for identification
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class UniqueIdEvent extends MessageHandler {
    public requiresLogin(): boolean {
        return false;
    }

    public handle(): void {
        // Read machine identification data
        const machineId = this.packet.readString();
        const fingerprint = this.packet.readString();
        const flashVersion = this.packet.readString();

        // Store machine ID
        this.client.setMachineId(machineId);

        // Send unique ID response
        const response = new ServerMessage(Outgoing.UniqueIdComposer);
        response.appendString(machineId);

        this.client.send(response);
    }
}
