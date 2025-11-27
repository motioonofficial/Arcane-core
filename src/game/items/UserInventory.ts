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
    limited_data: string; // format: "number:stack" (e.g., "0:0", "1:250")
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
            this.logger.info(`Loading inventory for user ${this.habbo.getId()}...`);

            const rows = await db.query<InventoryItemRow[]>(
                `SELECT * FROM items WHERE user_id = ? AND room_id = 0`,
                [this.habbo.getId()]
            );

            this.logger.info(`Found ${rows.length} items in database for user ${this.habbo.getId()}`);

            let skippedCount = 0;
            for (const row of rows) {
                const definition = this.itemManager.getDefinition(row.item_id);
                if (!definition) {
                    this.logger.debug(`Skipping item ${row.id}: no definition for item_id ${row.item_id}`);
                    skippedCount++;
                    continue;
                }

                // Parse limited_data (format: "number:stack")
                let limitedNumber = 0;
                let limitedStack = 0;
                if (row.limited_data && row.limited_data !== '0:0') {
                    const parts = row.limited_data.split(':');
                    if (parts.length === 2) {
                        limitedNumber = parseInt(parts[0], 10) || 0;
                        limitedStack = parseInt(parts[1], 10) || 0;
                    }
                }

                const data: InventoryItemData = {
                    id: row.id,
                    userId: row.user_id,
                    baseItemId: row.item_id,
                    extraData: row.extra_data || '0',
                    limitedNumber: limitedNumber,
                    limitedStack: limitedStack
                };

                const item = new InventoryItem(data, definition);
                this.items.set(item.getId(), item);
            }

            this.loaded = true;
            this.logger.info(`Loaded ${this.items.size} inventory items (${skippedCount} skipped due to missing definitions)`);
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
