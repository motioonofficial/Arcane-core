/**
 * MessageComposer - Base class for all outgoing packet composers
 * Each composer builds a specific packet type to send to clients
 */

import { ServerMessage } from './ServerMessage';

export abstract class MessageComposer {
    protected message!: ServerMessage;

    /**
     * Get the header ID for this message
     */
    public abstract getHeader(): number;

    /**
     * Compose the message content
     */
    public abstract compose(): void;

    /**
     * Build and return the ServerMessage
     */
    public build(): ServerMessage {
        this.message = new ServerMessage(this.getHeader());
        this.compose();
        return this.message;
    }
}

/**
 * Decorator for registering composers
 * Usage: @OutgoingPacket(HeaderId.SOME_RESPONSE)
 */
export function OutgoingPacket(header: number) {
    return function <T extends { new (...args: unknown[]): MessageComposer }>(constructor: T) {
        (constructor as { header?: number }).header = header;
        return constructor;
    };
}
