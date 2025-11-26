/**
 * WebSocketClient - Represents a connected WebSocket client (Nitro)
 * Manages the connection state, encryption, and message handling
 */

import type { ServerWebSocket } from 'bun';
import { Logger } from '../utils/Logger';
import { ClientMessage } from '../messages/ClientMessage';
import { ServerMessage } from '../messages/ServerMessage';
import type { Habbo } from '../game/users/Habbo';
import type { WebSocketData } from './WebSocketServer';

export class WebSocketClient {
    private static nextId = 1;

    public readonly id: number;
    public readonly socket: ServerWebSocket<WebSocketData>;
    public readonly ipAddress: string;
    public readonly connectTime: number;

    private logger: Logger;
    private buffer: Buffer = Buffer.alloc(0);

    // Session state
    private habbo: Habbo | null = null;
    private machineId: string = '';
    private handshakeComplete = false;
    private disconnecting = false;

    // Rate limiting
    private packetCount = 0;
    private lastPacketReset = Date.now();
    private static readonly MAX_PACKETS_PER_SECOND = 50;

    constructor(socket: ServerWebSocket<WebSocketData>) {
        this.id = WebSocketClient.nextId++;
        this.socket = socket;
        // Bun WebSocket doesn't expose remote address directly in the same way
        this.ipAddress = 'websocket-client';
        this.connectTime = Date.now();
        this.logger = new Logger(`WsClient:${this.id}`);

        this.logger.debug(`New WebSocket connection`);
    }

    /**
     * Process incoming data from WebSocket
     * Nitro packet format: [4 bytes length][2 bytes header][payload]
     */
    public onData(data: Buffer): ClientMessage[] {
        // Append new data to buffer
        this.buffer = Buffer.concat([this.buffer, data]);

        const messages: ClientMessage[] = [];

        // Process all complete packets in buffer
        while (this.buffer.length >= 6) {
            // Read packet length (4 bytes, big-endian) - includes header + payload
            const packetLength = this.buffer.readInt32BE(0);

            // Sanity check
            if (packetLength < 2 || packetLength > 1024 * 1024) {
                this.logger.warn(`Invalid packet length: ${packetLength}`);
                this.buffer = Buffer.alloc(0);
                break;
            }

            // Check if we have the complete packet
            if (this.buffer.length < 4 + packetLength) {
                break; // Wait for more data
            }

            // Extract packet data (header + payload, excluding length prefix)
            const packetData = this.buffer.subarray(4, 4 + packetLength);

            // Parse message (ClientMessage reads header from first 2 bytes)
            try {
                const message = new ClientMessage(packetData);
                messages.push(message);
            } catch (error) {
                this.logger.error('Failed to parse packet:', error);
            }

            // Remove processed data from buffer
            this.buffer = this.buffer.subarray(4 + packetLength);
        }

        return messages;
    }

    /**
     * Send a composed message to the client
     * Nitro expects: [4 bytes length][2 bytes header][payload]
     */
    public send(message: ServerMessage): void {
        if (this.disconnecting) return;

        try {
            const composed = message.compose();

            // Create packet with length prefix
            // Length = header (2 bytes) + payload length
            const packet = Buffer.alloc(4 + composed.length);
            packet.writeInt32BE(composed.length, 0);
            composed.copy(packet, 4);

            this.socket.send(packet);

            if (this.logger) {
                this.logger.packet('OUT', message.getHeader());
            }
        } catch (error) {
            this.logger.error('Failed to send message:', error);
        }
    }

    /**
     * Send raw bytes to the client
     */
    public sendRaw(data: Buffer | string): void {
        if (this.disconnecting) return;

        try {
            if (typeof data === 'string') {
                this.socket.send(Buffer.from(data));
            } else {
                this.socket.send(data);
            }
        } catch (error) {
            this.logger.error('Failed to send raw data:', error);
        }
    }

    /**
     * Enable encryption (not used for Nitro WebSocket, but kept for interface compatibility)
     */
    public enableEncryption(sharedKey: Buffer): void {
        // Nitro over WebSocket uses WSS (TLS) for encryption
        // No application-level encryption needed
        this.logger.debug('Encryption requested but not needed for WebSocket (use WSS)');
    }

    /**
     * Check rate limiting
     */
    public checkRateLimit(): boolean {
        const now = Date.now();
        if (now - this.lastPacketReset > 1000) {
            this.packetCount = 0;
            this.lastPacketReset = now;
        }

        this.packetCount++;
        return this.packetCount <= WebSocketClient.MAX_PACKETS_PER_SECOND;
    }

    /**
     * Disconnect the client
     */
    public disconnect(reason?: string): void {
        if (this.disconnecting) return;
        this.disconnecting = true;

        if (reason) {
            this.logger.debug(`Disconnecting: ${reason}`);
        }

        try {
            this.socket.close(1000, reason || 'Disconnected');
        } catch (error) {
            // Socket might already be closed
        }
    }

    /**
     * Clean up on disconnect
     */
    public dispose(): void {
        this.disconnecting = true;
        this.habbo = null;
        this.buffer = Buffer.alloc(0);
    }

    // Getters and setters
    public getHabbo(): Habbo | null {
        return this.habbo;
    }

    public setHabbo(habbo: Habbo): void {
        this.habbo = habbo;
    }

    public getMachineId(): string {
        return this.machineId;
    }

    public setMachineId(machineId: string): void {
        this.machineId = machineId;
    }

    public isHandshakeComplete(): boolean {
        return this.handshakeComplete;
    }

    public setHandshakeComplete(complete: boolean): void {
        this.handshakeComplete = complete;
    }

    public isEncryptionEnabled(): boolean {
        return false; // WebSocket doesn't use app-level encryption
    }

    public isDisconnecting(): boolean {
        return this.disconnecting;
    }

    public isLoggedIn(): boolean {
        return this.habbo !== null;
    }
}
