/**
 * GameEnvironment - Manages all game systems
 * Central hub for managers and game state
 */

import { Logger } from '../utils/Logger';
import { RoomManager } from './rooms/RoomManager';
import { NavigatorManager } from './navigator/NavigatorManager';
import { ItemManager } from './items/ItemManager';
import { CatalogManager } from './catalog/CatalogManager';
import { CommandManager, commandManager } from './commands/CommandManager';

export class GameEnvironment {
    private logger = new Logger('GameEnvironment');

    // Managers
    private roomManager!: RoomManager;
    private navigatorManager!: NavigatorManager;
    private itemManager!: ItemManager;
    private catalogManager!: CatalogManager;
    private commandManagerRef = commandManager;

    // Schedulers
    private schedulerInterval: ReturnType<typeof setInterval> | null = null;

    public async initialize(): Promise<void> {
        this.logger.info('Initializing game environment...');

        // Initialize managers
        await this.loadManagers();

        // Start schedulers
        this.startSchedulers();

        this.logger.info('Game environment initialized');
    }

    private async loadManagers(): Promise<void> {
        // Item Manager (load first, other managers depend on it)
        this.itemManager = new ItemManager();
        await this.itemManager.initialize();
        this.logger.debug('ItemManager loaded');

        // Catalog Manager (depends on ItemManager)
        this.catalogManager = new CatalogManager();
        await this.catalogManager.initialize(this.itemManager);
        this.logger.debug('CatalogManager loaded');

        // Room Manager
        this.roomManager = new RoomManager();
        await this.roomManager.initialize();
        this.logger.debug('RoomManager loaded');

        // Navigator Manager
        this.navigatorManager = new NavigatorManager();
        await this.navigatorManager.initialize();
        this.logger.debug('NavigatorManager loaded');

        // Command Manager
        await this.commandManagerRef.initialize();
        this.logger.debug('CommandManager loaded');
    }

    private startSchedulers(): void {
        // Main game tick (every second)
        this.schedulerInterval = setInterval(() => {
            this.gameTick();
        }, 1000);

        this.logger.debug('Schedulers started');
    }

    private gameTick(): void {
        // TODO: Process game logic
        // - Update room physics
        // - Process scheduled tasks
        // - Send credits/pixels rewards
    }

    public async dispose(): Promise<void> {
        // Stop schedulers
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }

        this.logger.info('Game environment disposed');
    }

    // Getters
    public getRoomManager(): RoomManager {
        return this.roomManager;
    }

    public getNavigatorManager(): NavigatorManager {
        return this.navigatorManager;
    }

    public getItemManager(): ItemManager {
        return this.itemManager;
    }

    public getCommandManager(): CommandManager {
        return this.commandManagerRef;
    }

    public getCatalogManager(): CatalogManager {
        return this.catalogManager;
    }
}

// Singleton export for convenient access
export let game: GameEnvironment;

export function setGameInstance(instance: GameEnvironment): void {
    game = instance;
}
