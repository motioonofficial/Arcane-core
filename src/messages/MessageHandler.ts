/**
 * MessageHandler - Base class for all incoming packet handlers
 * Each handler processes a specific packet type from the client
 */

import type { GameClient } from '../network/GameClient';
import type { WebSocketClient } from '../network/WebSocketClient';
import type { ClientMessage } from './ClientMessage';

type AnyClient = GameClient | WebSocketClient;

export abstract class MessageHandler {
    protected client!: AnyClient;
    protected packet!: ClientMessage;

    /**
     * Set the client and packet for this handler
     */
    public init(client: AnyClient, packet: ClientMessage): void {
        this.client = client;
        this.packet = packet;
    }

    /**
     * Handle the packet - must be implemented by subclasses
     */
    public abstract handle(): Promise<void> | void;

    /**
     * Get rate limit in milliseconds (0 = no limit)
     * Override in subclasses to add rate limiting
     */
    public getRateLimit(): number {
        return 0;
    }

    /**
     * Whether this handler requires the client to be logged in
     * Override in subclasses if login is not required (e.g., handshake)
     */
    public requiresLogin(): boolean {
        return true;
    }
}

/**
 * Decorator for registering handlers
 * Usage: @IncomingPacket(HeaderId.SOME_PACKET)
 */
export function IncomingPacket(header: number) {
    return function <T extends { new (...args: unknown[]): MessageHandler }>(constructor: T) {
        // Store the header on the class for later registration
        (constructor as { header?: number }).header = header;
        return constructor;
    };
}
