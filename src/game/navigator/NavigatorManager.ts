/**
 * NavigatorManager - Manages navigator categories and searches
 */

import { Logger } from '../../utils/Logger';
import { emulator } from '../../core/Emulator';

export interface NavigatorCategory {
    id: number;
    minRank: number;
    caption: string;
    canTrade: boolean;
    maxUserCount: number;
    isPublic: boolean;
    order: number;
}

export interface NavigatorPublicCategory {
    id: number;
    name: string;
    image: string;
    order: number;
    visible: boolean;
}

export class NavigatorManager {
    private logger = new Logger('NavigatorManager');
    private categories: Map<number, NavigatorCategory> = new Map();
    private publicCategories: Map<number, NavigatorPublicCategory> = new Map();

    public async initialize(): Promise<void> {
        await this.loadCategories();
        await this.loadPublicCategories();
        this.logger.info(`Loaded ${this.categories.size} room categories`);
        this.logger.info(`Loaded ${this.publicCategories.size} public categories`);
    }

    private async loadCategories(): Promise<void> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query<{
                id: number;
                min_rank: number;
                caption: string;
                can_trade: string;
                max_user_count: number;
                public: string;
                order_num: number;
            }[]>('SELECT * FROM navigator_flatcats ORDER BY order_num ASC');

            for (const row of rows) {
                this.categories.set(row.id, {
                    id: row.id,
                    minRank: row.min_rank,
                    caption: row.caption,
                    canTrade: row.can_trade === '1',
                    maxUserCount: row.max_user_count,
                    isPublic: row.public === '1',
                    order: row.order_num
                });
            }
        } catch (error) {
            this.logger.error('Failed to load categories:', error);
        }
    }

    private async loadPublicCategories(): Promise<void> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query<{
                id: number;
                name: string;
                image: string;
                order_num: number;
                visible: string;
            }[]>('SELECT * FROM navigator_publiccats ORDER BY order_num ASC');

            for (const row of rows) {
                this.publicCategories.set(row.id, {
                    id: row.id,
                    name: row.name,
                    image: row.image,
                    order: row.order_num,
                    visible: row.visible === '1'
                });
            }
        } catch (error) {
            this.logger.error('Failed to load public categories:', error);
        }
    }

    public getCategory(id: number): NavigatorCategory | undefined {
        return this.categories.get(id);
    }

    public getCategories(): NavigatorCategory[] {
        return Array.from(this.categories.values());
    }

    public getPublicCategories(): NavigatorPublicCategory[] {
        return Array.from(this.publicCategories.values());
    }

    public getCategoriesForRank(rank: number): NavigatorCategory[] {
        return this.getCategories().filter(cat => cat.minRank <= rank);
    }
}
