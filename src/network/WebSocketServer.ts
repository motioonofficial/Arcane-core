/**
 * WebSocketServer - Bun WebSocket Server for Nitro Client
 * Handles WebSocket connections and message framing
 */

import { config } from '../config/Configuration';
import { Logger } from '../utils/Logger';
import { WebSocketClient } from './WebSocketClient';
import { PacketManager } from '../messages/PacketManager';
import type { ServerWebSocket } from 'bun';

export interface WebSocketData {
    client: WebSocketClient;
}

export class WebSocketServer {
    private logger = new Logger('WebSocketServer');
    private server: ReturnType<typeof Bun.serve> | null = null;
    private clients: Map<number, WebSocketClient> = new Map();
    private packetManager: PacketManager;

    constructor(packetManager: PacketManager) {
        this.packetManager = packetManager;
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = Bun.serve<WebSocketData>({
                    hostname: config.server.host,
                    port: config.server.port,

                    fetch(req, server) {
                        // Upgrade HTTP request to WebSocket
                        const url = new URL(req.url);

                        // Handle WebSocket upgrade
                        if (server.upgrade(req, {
                            data: {
                                client: null as unknown as WebSocketClient
                            }
                        })) {
                            return; // Upgrade successful
                        }

                        // Return 404 for non-WebSocket requests
                        return new Response('Arcane-TS Emulator - WebSocket Only', {
                            status: 200,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    },

                    websocket: {
                        open: (ws: ServerWebSocket<WebSocketData>) => {
                            this.onConnection(ws);
                        },

                        message: (ws: ServerWebSocket<WebSocketData>, message: Buffer | string) => {
                            this.onMessage(ws, message);
                        },

                        close: (ws: ServerWebSocket<WebSocketData>, code: number, reason: string) => {
                            this.onClose(ws, code, reason);
                        },
                    }
                });

                this.logger.info(`WebSocket server started on ws://${config.server.host}:${config.server.port}`);
                resolve();
            } catch (error) {
                this.logger.error('Failed to start WebSocket server:', error);
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

        this.logger.info('WebSocket server stopped');
    }

    private onConnection(ws: ServerWebSocket<WebSocketData>): void {
        // Check max connections
        if (this.clients.size >= config.server.maxConnections) {
            this.logger.warn('Max connections reached, rejecting connection');
            ws.close(1013, 'Server is full');
            return;
        }

        // Create client
        const client = new WebSocketClient(ws);
        ws.data.client = client;
        this.clients.set(client.id, client);

        this.logger.debug(`Client ${client.id} connected via WebSocket`);
    }

    private async onMessage(ws: ServerWebSocket<WebSocketData>, message: Buffer | string): Promise<void> {
        const client = ws.data?.client;
        if (!client) return;

        try {
            // Convert to Buffer if string
            let data: Buffer;
            if (typeof message === 'string') {
                data = Buffer.from(message);
            } else if (message instanceof ArrayBuffer) {
                data = Buffer.from(message);
            } else {
                data = Buffer.from(message);
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
            for (const msg of messages) {
                if (config.log.logPackets) {
                    this.logger.packet('IN', msg.getHeader());
                }

                await this.packetManager.handlePacket(client, msg);
            }

        } catch (error) {
            this.logger.error(`Error processing message from client ${client.id}:`, error);
        }
    }

    private onClose(ws: ServerWebSocket<WebSocketData>, code: number, reason: string): void {
        const client = ws.data?.client;
        if (!client) return;

        this.logger.debug(`Client ${client.id} disconnected (code: ${code}, reason: ${reason})`);
        client.dispose();
        this.clients.delete(client.id);
    }

    // Client management
    public getClient(id: number): WebSocketClient | undefined {
        return this.clients.get(id);
    }

    public getClientCount(): number {
        return this.clients.size;
    }

    public getAllClients(): WebSocketClient[] {
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
