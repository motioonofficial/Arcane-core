/**
 * GameClient - Represents a connected client session
 * Manages the connection state, encryption, and message handling
 */

import type { Socket } from 'bun';
import { Logger } from '../utils/Logger';
import { ClientMessage } from '../messages/ClientMessage';
import { ServerMessage } from '../messages/ServerMessage';
import { RC4 } from '../crypto/RC4';
import type { Habbo } from '../game/users/Habbo';
import { game } from '../game/GameEnvironment';

export class GameClient {
    private static nextId = 1;

    public readonly id: number;
    public readonly socket: Socket<GameClient>;
    public readonly ipAddress: string;
    public readonly connectTime: number;

    private logger: Logger;
    private buffer: Buffer = Buffer.alloc(0);

    // Encryption
    private rc4Client: RC4 | null = null;
    private rc4Server: RC4 | null = null;
    private encryptionEnabled = false;

    // Session state
    private habbo: Habbo | null = null;
    private machineId: string = '';
    private handshakeComplete = false;
    private disconnecting = false;

    // Rate limiting
    private packetCount = 0;
    private lastPacketReset = Date.now();
    private static readonly MAX_PACKETS_PER_SECOND = 50;

    constructor(socket: Socket<GameClient>) {
        this.id = GameClient.nextId++;
        this.socket = socket;
        this.ipAddress = socket.remoteAddress || 'unknown';
        this.connectTime = Date.now();
        this.logger = new Logger(`Client:${this.id}`);

        this.logger.debug(`New connection from ${this.ipAddress}`);
    }

    /**
     * Process incoming data from socket
     */
    public onData(data: Buffer): ClientMessage[] {
        // Append new data to buffer
        this.buffer = Buffer.concat([this.buffer, data]);

        const messages: ClientMessage[] = [];

        // Process all complete packets in buffer
        while (this.buffer.length >= 6) {
            // Read packet length (4 bytes)
            const packetLength = this.buffer.readInt32BE(0);

            // Check if we have the complete packet
            if (this.buffer.length < 4 + packetLength) {
                break; // Wait for more data
            }

            // Extract packet data (excluding length prefix)
            const packetData = this.buffer.subarray(4, 4 + packetLength);

            // Decrypt if encryption is enabled
            let decryptedData = packetData;
            if (this.encryptionEnabled && this.rc4Client) {
                decryptedData = this.rc4Client.decrypt(packetData);
            }

            // Parse message
            const message = new ClientMessage(decryptedData);
            messages.push(message);

            // Remove processed data from buffer
            this.buffer = this.buffer.subarray(4 + packetLength);
        }

        return messages;
    }

    /**
     * Send a composed message to the client
     */
    public send(message: ServerMessage): void {
        if (this.disconnecting) return;

        try {
            let data = message.compose();

            // Encrypt if encryption is enabled
            if (this.encryptionEnabled && this.rc4Server) {
                data = this.rc4Server.encrypt(data);
            }

            // Create packet with length prefix
            const packet = Buffer.alloc(4 + data.length);
            packet.writeInt32BE(data.length, 0);
            data.copy(packet, 4);

            this.socket.write(packet);

            if (this.logger) {
                this.logger.packet('OUT', message.getHeader());
            }
        } catch (error) {
            this.logger.error('Failed to send message:', error);
        }
    }

    /**
     * Send raw bytes to the client (for policy file, etc)
     */
    public sendRaw(data: Buffer | string): void {
        if (this.disconnecting) return;

        try {
            if (typeof data === 'string') {
                this.socket.write(Buffer.from(data));
            } else {
                this.socket.write(data);
            }
        } catch (error) {
            this.logger.error('Failed to send raw data:', error);
        }
    }

    /**
     * Enable RC4 encryption with the given key
     */
    public enableEncryption(sharedKey: Buffer): void {
        this.rc4Client = new RC4(sharedKey);
        this.rc4Server = new RC4(sharedKey);
        this.encryptionEnabled = true;
        this.logger.debug('Encryption enabled');
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
        return this.packetCount <= GameClient.MAX_PACKETS_PER_SECOND;
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
            this.socket.end();
        } catch (error) {
            // Socket might already be closed
        }
    }

    /**
     * Clean up on disconnect
     */
    public async dispose(): Promise<void> {
        this.disconnecting = true;

        // Remove from HabboManager and dispose Habbo
        if (this.habbo) {
            const habboManager = game.getHabboManager();
            if (habboManager) {
                habboManager.removeHabbo(this.habbo);
            }
            await this.habbo.dispose();
            this.habbo = null;
        }

        this.rc4Client = null;
        this.rc4Server = null;
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
        return this.encryptionEnabled;
    }

    public isDisconnecting(): boolean {
        return this.disconnecting;
    }

    public isLoggedIn(): boolean {
        return this.habbo !== null;
    }
}
