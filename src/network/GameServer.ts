/**
 * GameServer - Bun TCP Server
 * Handles all incoming connections and routes packets to handlers
 */

import { config } from '../config/Configuration';
import { Logger } from '../utils/Logger';
import { GameClient } from './GameClient';
import { PacketManager } from '../messages/PacketManager';
import type { Socket, TCPSocketListener } from 'bun';

export class GameServer {
    private logger = new Logger('GameServer');
    private server: TCPSocketListener<GameClient> | null = null;
    private clients: Map<number, GameClient> = new Map();
    private packetManager: PacketManager;

    // Flash policy file response
    private static readonly POLICY_FILE =
        '<?xml version="1.0"?>\r\n' +
        '<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">\r\n' +
        '<cross-domain-policy>\r\n' +
        '<allow-access-from domain="*" to-ports="*" />\r\n' +
        '</cross-domain-policy>\0';

    constructor(packetManager: PacketManager) {
        this.packetManager = packetManager;
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = Bun.listen<GameClient>({
                    hostname: config.server.host,
                    port: config.server.port,

                    socket: {
                        open: (socket) => {
                            this.onConnection(socket);
                        },

                        data: (socket, data) => {
                            this.onData(socket, Buffer.from(data));
                        },

                        close: (socket) => {
                            this.onClose(socket);
                        },

                        error: (socket, error) => {
                            this.onError(socket, error);
                        },

                        drain: (socket) => {
                            // Socket is ready to receive more data
                        }
                    }
                });

                this.logger.info(`TCP server started on ${config.server.host}:${config.server.port}`);
                resolve();
            } catch (error) {
                this.logger.error('Failed to start TCP server:', error);
                reject(error);
            }
        });
    }

    public async stop(): Promise<void> {
        // Disconnect all clients
        for (const client of this.clients.values()) {
            client.disconnect('Server shutting down');
            client.dispose();
        }
        this.clients.clear();

        // Stop the server
        if (this.server) {
            this.server.stop();
            this.server = null;
        }

        this.logger.info('TCP server stopped');
    }

    private onConnection(socket: Socket<GameClient>): void {
        // Check max connections
        if (this.clients.size >= config.server.maxConnections) {
            this.logger.warn(`Max connections reached, rejecting ${socket.remoteAddress}`);
            socket.end();
            return;
        }

        // Create client
        const client = new GameClient(socket);
        socket.data = client;
        this.clients.set(client.id, client);

        this.logger.debug(`Client ${client.id} connected from ${client.ipAddress}`);
    }

    private async onData(socket: Socket<GameClient>, data: Buffer): Promise<void> {
        const client = socket.data;
        if (!client) return;

        try {
            // Check for Flash policy request
            if (data[0] === 0x3C) { // '<'
                const request = data.toString();
                if (request.includes('policy-file-request')) {
                    this.logger.debug(`Sending policy file to client ${client.id}`);
                    client.sendRaw(GameServer.POLICY_FILE);
                    return;
                }
            }

            // Rate limiting
            if (!client.checkRateLimit()) {
                this.logger.warn(`Client ${client.id} rate limited`);
                client.disconnect('Rate limit exceeded');
                return;
            }

            // Parse messages from buffer
            const messages = client.onData(data);

            // Process each message
            for (const message of messages) {
                if (config.log.logPackets) {
                    this.logger.packet('IN', message.getHeader());
                }

                await this.packetManager.handlePacket(client, message);
            }

        } catch (error) {
            this.logger.error(`Error processing data from client ${client.id}:`, error);
            client.disconnect('Protocol error');
        }
    }

    private onClose(socket: Socket<GameClient>): void {
        const client = socket.data;
        if (!client) return;

        this.logger.debug(`Client ${client.id} disconnected`);
        client.dispose();
        this.clients.delete(client.id);
    }

    private onError(socket: Socket<GameClient>, error: Error): void {
        const client = socket.data;
        if (client) {
            this.logger.error(`Socket error for client ${client.id}:`, error.message);
            client.dispose();
            this.clients.delete(client.id);
        }
    }

    // Client management
    public getClient(id: number): GameClient | undefined {
        return this.clients.get(id);
    }

    public getClientCount(): number {
        return this.clients.size;
    }

    public getAllClients(): GameClient[] {
        return Array.from(this.clients.values());
    }

    public broadcastMessage(message: import('../messages/ServerMessage').ServerMessage): void {
        for (const client of this.clients.values()) {
            if (client.isLoggedIn()) {
                client.send(message);
            }
        }
    }
}
