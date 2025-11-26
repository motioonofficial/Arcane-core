/**
 * ItemManager - Manages furniture definitions from database
 */

import { Logger } from '../../utils/Logger';
import { emulator } from '../../core/Emulator';
import { FurnitureDefinition, type FurnitureDefinitionData } from './FurnitureDefinition';

interface ItemBaseRow {
    id: number;
    sprite_id: number;
    public_name: string;
    item_name: string;
    type: string;
    width: number;
    length: number;
    stack_height: number;
    allow_stack: number;
    allow_sit: number;
    allow_lay: number;
    allow_walk: number;
    allow_recycle: number;
    allow_trade: number;
    allow_marketplace_sell: number;
    allow_gift: number;
    allow_inventory_stack: number;
    interaction_type: string;
    interaction_modes_count: number;
    vending_ids: string;
    multiheight: string;
    customparams: string;
    effect_id_male: number;
    effect_id_female: number;
}

export class ItemManager {
    private logger = new Logger('ItemManager');
    private definitions: Map<number, FurnitureDefinition> = new Map();
    private definitionsByName: Map<string, FurnitureDefinition> = new Map();

    public async initialize(): Promise<void> {
        await this.loadDefinitions();
    }

    private async loadDefinitions(): Promise<void> {
        const db = emulator.getDatabase();

        try {
            const rows = await db.query<ItemBaseRow[]>(
                `SELECT * FROM items_base`
            );

            for (const row of rows) {
                const data: FurnitureDefinitionData = {
                    id: row.id,
                    spriteId: row.sprite_id,
                    publicName: row.public_name,
                    itemName: row.item_name,
                    type: row.type,
                    width: row.width,
                    length: row.length,
                    stackHeight: row.stack_height,
                    canStack: row.allow_stack === 1,
                    canSit: row.allow_sit === 1,
                    canLay: row.allow_lay === 1,
                    isWalkable: row.allow_walk === 1,
                    allowRecycle: row.allow_recycle === 1,
                    allowTrade: row.allow_trade === 1,
                    allowMarketplace: row.allow_marketplace_sell === 1,
                    allowGift: row.allow_gift === 1,
                    allowInventoryStack: row.allow_inventory_stack === 1,
                    interactionType: row.interaction_type || 'default',
                    interactionModesCount: row.interaction_modes_count,
                    vendingIds: row.vending_ids || '',
                    multiHeight: row.multiheight || '',
                    customParams: row.customparams || '',
                    effectIdMale: row.effect_id_male,
                    effectIdFemale: row.effect_id_female
                };

                const definition = new FurnitureDefinition(data);
                this.definitions.set(definition.getId(), definition);
                this.definitionsByName.set(definition.getItemName().toLowerCase(), definition);
            }

            this.logger.info(`Loaded ${this.definitions.size} furniture definitions`);
        } catch (error) {
            this.logger.error('Failed to load furniture definitions:', error);
        }
    }

    public getDefinition(id: number): FurnitureDefinition | undefined {
        return this.definitions.get(id);
    }

    public getDefinitionByName(name: string): FurnitureDefinition | undefined {
        return this.definitionsByName.get(name.toLowerCase());
    }

    public getDefinitions(): FurnitureDefinition[] {
        return Array.from(this.definitions.values());
    }

    public getDefinitionCount(): number {
        return this.definitions.size;
    }
}
