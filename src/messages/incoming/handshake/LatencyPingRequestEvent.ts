/**
 * LatencyPingRequestEvent
 * Client requests latency measurement
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class LatencyPingRequestEvent extends MessageHandler {
    public requiresLogin(): boolean {
        return false;
    }

    public handle(): void {
        const requestId = this.packet.readInt();

        // Send latency response
        const response = new ServerMessage(Outgoing.LatencyResponseComposer);
        response.appendInt(requestId);

        this.client.send(response);
    }
}
