/**
 * LoggingConfig - Manages logging configuration from JSON file
 * Allows runtime control of detailed logging for different categories
 */

import { readFileSync, existsSync, watchFile } from 'fs';
import { join } from 'path';

export interface PacketLoggingConfig {
    enabled: boolean;
    incoming: boolean;
    outgoing: boolean;
    showData: boolean;
    showName: boolean;
}

export interface MovementLoggingConfig {
    enabled: boolean;
    showPath: boolean;
    showPosition: boolean;
    showRotation: boolean;
}

export interface RoomLoggingConfig {
    enabled: boolean;
    showEntry: boolean;
    showExit: boolean;
    showLoad: boolean;
}

export interface ChatLoggingConfig {
    enabled: boolean;
    showMessages: boolean;
    showWhispers: boolean;
}

export interface UserLoggingConfig {
    enabled: boolean;
    showLogin: boolean;
    showLogout: boolean;
    showActions: boolean;
}

export interface DatabaseLoggingConfig {
    enabled: boolean;
    showQueries: boolean;
    showErrors: boolean;
}

export interface NetworkLoggingConfig {
    enabled: boolean;
    showConnections: boolean;
    showDisconnections: boolean;
    showErrors: boolean;
}

export interface LoggingCategories {
    packets: PacketLoggingConfig;
    movement: MovementLoggingConfig;
    rooms: RoomLoggingConfig;
    chat: ChatLoggingConfig;
    users: UserLoggingConfig;
    database: DatabaseLoggingConfig;
    network: NetworkLoggingConfig;
}

export interface LoggingFormat {
    timestamp: boolean;
    colors: boolean;
    context: boolean;
}

export interface LoggingSettings {
    enabled: boolean;
    level: string;
    allCategories: boolean;
    categories: LoggingCategories;
    format: LoggingFormat;
}

const defaultConfig: LoggingSettings = {
    enabled: true,
    level: 'info',
    allCategories: false,
    categories: {
        packets: { enabled: false, incoming: true, outgoing: true, showData: false, showName: true },
        movement: { enabled: false, showPath: true, showPosition: true, showRotation: true },
        rooms: { enabled: false, showEntry: true, showExit: true, showLoad: true },
        chat: { enabled: false, showMessages: true, showWhispers: false },
        users: { enabled: false, showLogin: true, showLogout: true, showActions: true },
        database: { enabled: false, showQueries: false, showErrors: true },
        network: { enabled: false, showConnections: true, showDisconnections: true, showErrors: true }
    },
    format: { timestamp: true, colors: true, context: true }
};

class LoggingConfigManager {
    private static instance: LoggingConfigManager;
    private config: LoggingSettings;
    private configPath: string;

    private constructor() {
        this.configPath = join(process.cwd(), 'config', 'logging.json');
        this.config = this.loadConfig();
        this.watchConfig();
    }

    public static getInstance(): LoggingConfigManager {
        if (!LoggingConfigManager.instance) {
            LoggingConfigManager.instance = new LoggingConfigManager();
        }
        return LoggingConfigManager.instance;
    }

    private loadConfig(): LoggingSettings {
        try {
            if (existsSync(this.configPath)) {
                const content = readFileSync(this.configPath, 'utf-8');
                const parsed = JSON.parse(content);
                return { ...defaultConfig, ...parsed.logging };
            }
        } catch (error) {
            console.error('[LoggingConfig] Failed to load config, using defaults:', error);
        }
        return defaultConfig;
    }

    private watchConfig(): void {
        try {
            if (existsSync(this.configPath)) {
                watchFile(this.configPath, { interval: 2000 }, () => {
                    console.log('[LoggingConfig] Config file changed, reloading...');
                    this.config = this.loadConfig();
                });
            }
        } catch (error) {
            // Ignore watch errors
        }
    }

    public reload(): void {
        this.config = this.loadConfig();
    }

    // Main getters
    public isEnabled(): boolean {
        return this.config.enabled;
    }

    public getLevel(): string {
        return this.config.level;
    }

    public getFormat(): LoggingFormat {
        return this.config.format;
    }

    // Category getters
    public get packets(): PacketLoggingConfig {
        return this.config.categories.packets;
    }

    public get movement(): MovementLoggingConfig {
        return this.config.categories.movement;
    }

    public get rooms(): RoomLoggingConfig {
        return this.config.categories.rooms;
    }

    public get chat(): ChatLoggingConfig {
        return this.config.categories.chat;
    }

    public get users(): UserLoggingConfig {
        return this.config.categories.users;
    }

    public get database(): DatabaseLoggingConfig {
        return this.config.categories.database;
    }

    public get network(): NetworkLoggingConfig {
        return this.config.categories.network;
    }

    // Quick check methods - allCategories overrides individual settings
    public shouldLogPackets(): boolean {
        return this.config.enabled && (this.config.allCategories || this.config.categories.packets.enabled);
    }

    public shouldLogMovement(): boolean {
        return this.config.enabled && (this.config.allCategories || this.config.categories.movement.enabled);
    }

    public shouldLogRooms(): boolean {
        return this.config.enabled && (this.config.allCategories || this.config.categories.rooms.enabled);
    }

    public shouldLogChat(): boolean {
        return this.config.enabled && (this.config.allCategories || this.config.categories.chat.enabled);
    }

    public shouldLogUsers(): boolean {
        return this.config.enabled && (this.config.allCategories || this.config.categories.users.enabled);
    }

    public shouldLogDatabase(): boolean {
        return this.config.enabled && (this.config.allCategories || this.config.categories.database.enabled);
    }

    public shouldLogNetwork(): boolean {
        return this.config.enabled && (this.config.allCategories || this.config.categories.network.enabled);
    }

    public isAllCategoriesEnabled(): boolean {
        return this.config.allCategories;
    }
}

export const loggingConfig = LoggingConfigManager.getInstance();
