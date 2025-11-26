/**
 * Arcane Emulator - Main Entry Point
 * TypeScript/Bun implementation of Habbo Hotel Server
 */

import { config } from '../config/Configuration';
import { Logger } from '../utils/Logger';
import { Database } from '../database/Database';
import { GameServer } from '../network/GameServer';
import { WebSocketServer } from '../network/WebSocketServer';
import { GameEnvironment, setGameInstance } from '../game/GameEnvironment';
import { PacketManager } from '../messages/PacketManager';

export class Emulator {
    private static instance: Emulator;
    private logger = new Logger('Emulator');

    private database!: Database;
    private gameServer!: GameServer;
    private webSocketServer!: WebSocketServer;
    private gameEnvironment!: GameEnvironment;
    private packetManager!: PacketManager;

    private isRunning = false;
    private startTime!: number;

    public static readonly VERSION = '1.0.0';
    public static readonly BUILD = 'Arcane-TS';

    private constructor() {}

    public static getInstance(): Emulator {
        if (!Emulator.instance) {
            Emulator.instance = new Emulator();
        }
        return Emulator.instance;
    }

    public async start(): Promise<void> {
        this.startTime = Date.now();

        this.printBanner();
        this.logger.info(`Starting ${Emulator.BUILD} v${Emulator.VERSION}...`);

        // Set log level from config
        Logger.setLevel(config.log.level as 'debug' | 'info' | 'warn' | 'error');

        try {
            // Initialize Database
            this.logger.info('Connecting to database...');
            this.database = new Database();
            await this.database.connect();
            this.logger.info('Database connected successfully');

            // Initialize Packet Manager
            this.logger.info('Initializing packet manager...');
            this.packetManager = new PacketManager();
            await this.packetManager.initialize();
            this.logger.info(`Loaded ${this.packetManager.getHandlerCount()} packet handlers`);

            // Initialize Game Environment
            this.logger.info('Loading game environment...');
            this.gameEnvironment = new GameEnvironment();
            setGameInstance(this.gameEnvironment);
            await this.gameEnvironment.initialize();
            this.logger.info('Game environment loaded');

            // Start WebSocket Server (for Nitro client)
            this.logger.info('Starting WebSocket server...');
            this.webSocketServer = new WebSocketServer(this.packetManager);
            await this.webSocketServer.start();

            this.isRunning = true;
            const elapsed = Date.now() - this.startTime;
            this.logger.info(`Server started successfully in ${elapsed}ms`);
            this.logger.info(`WebSocket listening on ws://${config.server.host}:${config.server.port}`);

            // Handle shutdown
            this.setupShutdownHandlers();

        } catch (error) {
            this.logger.error('Failed to start emulator:', error);
            await this.stop();
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) return;

        this.logger.info('Shutting down emulator...');
        this.isRunning = false;

        try {
            // Stop WebSocket server
            if (this.webSocketServer) {
                await this.webSocketServer.stop();
            }

            // Dispose game environment
            if (this.gameEnvironment) {
                await this.gameEnvironment.dispose();
            }

            // Close database connections
            if (this.database) {
                await this.database.close();
            }

            this.logger.info('Emulator shut down gracefully');
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        }
    }

    private setupShutdownHandlers(): void {
        const shutdown = async () => {
            await this.stop();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught exception:', error);
        });
        process.on('unhandledRejection', (reason) => {
            this.logger.error('Unhandled rejection:', reason);
        });
    }

    private printBanner(): void {
        console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║     █████╗ ██████╗  ██████╗ █████╗ ███╗   ██╗███████╗    ║
    ║    ██╔══██╗██╔══██╗██╔════╝██╔══██╗████╗  ██║██╔════╝    ║
    ║    ███████║██████╔╝██║     ███████║██╔██╗ ██║█████╗      ║
    ║    ██╔══██║██╔══██╗██║     ██╔══██║██║╚██╗██║██╔══╝      ║
    ║    ██║  ██║██║  ██║╚██████╗██║  ██║██║ ╚████║███████╗    ║
    ║    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝    ║
    ║                                                           ║
    ║           Habbo Hotel Emulator - TypeScript/Bun           ║
    ║                    Version ${Emulator.VERSION.padEnd(10)}                     ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
        `);
    }

    // Getters
    public getDatabase(): Database {
        return this.database;
    }

    public getGameServer(): WebSocketServer {
        return this.webSocketServer;
    }

    public getGameEnvironment(): GameEnvironment {
        return this.gameEnvironment;
    }

    public getPacketManager(): PacketManager {
        return this.packetManager;
    }

    public getUptime(): number {
        return Date.now() - this.startTime;
    }

    public getIsRunning(): boolean {
        return this.isRunning;
    }
}

export const emulator = Emulator.getInstance();
