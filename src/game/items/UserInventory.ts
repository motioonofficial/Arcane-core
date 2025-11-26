/**
 * UserInventory - Manages user's inventory items
 */

import { Logger } from '../../utils/Logger';
import { emulator } from '../../core/Emulator';
import { InventoryItem, type InventoryItemData } from './InventoryItem';
import type { ItemManager } from './ItemManager';
import type { Habbo } from '../users/Habbo';

interface InventoryItemRow {
    id: number;
    user_id: number;
    item_id: number;
    extra_data: string;
    limited_number: number;
    limited_stack: number;
}

export class UserInventory {
    private logger: Logger;
    private habbo: Habbo;
    private itemManager: ItemManager;
    private items: Map<number, InventoryItem> = new Map();
    private loaded: boolean = false;

    constructor(habbo: Habbo, itemManager: ItemManager) {
        this.habbo = habbo;
        this.itemManager = itemManager;
        this.logger = new Logger(`Inventory:${habbo.getId()}`);
    }

    public async load(): Promise<void> {
        if (this.loaded) return;

        const db = emulator.getDatabase();

        try {
            const rows = await db.query<InventoryItemRow[]>(
                `SELECT * FROM items WHERE user_id = ? AND room_id = 0`,
                [this.habbo.getId()]
            );

            for (const row of rows) {
                const definition = this.itemManager.getDefinition(row.item_id);
                if (!definition) {
                    continue;
                }

                const data: InventoryItemData = {
                    id: row.id,
                    userId: row.user_id,
                    baseItemId: row.item_id,
                    extraData: row.extra_data || '0',
                    limitedNumber: row.limited_number || 0,
                    limitedStack: row.limited_stack || 0
                };

                const item = new InventoryItem(data, definition);
                this.items.set(item.getId(), item);
            }

            this.loaded = true;
            this.logger.debug(`Loaded ${this.items.size} inventory items`);
        } catch (error) {
            this.logger.error('Failed to load inventory:', error);
        }
    }

    /**
     * Add item to inventory
     */
    public addItem(item: InventoryItem): void {
        this.items.set(item.getId(), item);
    }

    /**
     * Remove item from inventory
     */
    public removeItem(itemId: number): InventoryItem | undefined {
        const item = this.items.get(itemId);
        if (item) {
            this.items.delete(itemId);
        }
        return item;
    }

    /**
     * Get item by ID
     */
    public getItem(itemId: number): InventoryItem | undefined {
        return this.items.get(itemId);
    }

    /**
     * Get all items
     */
    public getItems(): InventoryItem[] {
        return Array.from(this.items.values());
    }

    /**
     * Get floor items only
     */
    public getFloorItems(): InventoryItem[] {
        return this.getItems().filter(item => item.getDefinition().isFloorItem());
    }

    /**
     * Get wall items only
     */
    public getWallItems(): InventoryItem[] {
        return this.getItems().filter(item => item.getDefinition().isWallItem());
    }

    /**
     * Get item count
     */
    public getItemCount(): number {
        return this.items.size;
    }

    /**
     * Check if inventory is loaded
     */
    public isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * Clear inventory cache (for reload)
     */
    public clear(): void {
        this.items.clear();
        this.loaded = false;
    }
}
