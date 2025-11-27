/**
 * CatalogManager - Manages catalog pages and items
 */

import { Logger } from '../../utils/Logger';
import { emulator } from '../../core/Emulator';
import { CatalogPage, type CatalogPageData } from './CatalogPage';
import { CatalogItem, type CatalogItemData } from './CatalogItem';
import type { ItemManager } from '../items/ItemManager';

interface CatalogPageRow {
    id: number;
    parent_id: string; // VARCHAR in DB, can be '-1' or page id
    caption_save: string; // page identifier
    caption: string;
    icon_color: number;
    icon_image: number;
    visible: string; // ENUM '0' or '1'
    enabled: string; // ENUM '0' or '1'
    min_rank: number;
    club_only: string; // ENUM '0' or '1'
    vip_only: string; // ENUM '0' or '1'
    order_num: number;
    page_layout: string;
    page_headline: string;
    page_teaser: string;
    page_special: string;
    page_text1: string;
    page_text2: string;
    page_text_details: string;
    page_text_teaser: string;
}

interface CatalogItemRow {
    id: number;
    page_id: string; // VARCHAR in DB
    item_ids: string;
    catalog_name: string;
    cost_credits: number;
    cost_points: number;
    points_type: number;
    amount: number;
    limited_sells: number;
    limited_stack: number;
    club_only: string; // ENUM '0' or '1'
    have_offer: string; // ENUM '0' or '1'
    offer_id: number;
    order_number: number;
    extradata: string;
    song_id: number;
}

interface LimitedSoldRow {
    catalog_item_id: number;
    sold_count: number;
}

export class CatalogManager {
    private logger = new Logger('CatalogManager');
    private pages: Map<number, CatalogPage> = new Map();
    private items: Map<number, CatalogItem> = new Map();
    private itemManager!: ItemManager;

    public async initialize(itemManager: ItemManager): Promise<void> {
        this.itemManager = itemManager;
        await this.loadPages();
        await this.loadItems();
        await this.loadLimitedSold();
        this.buildPageHierarchy();

        const rootPages = this.getRootPages();
        this.logger.info(`Loaded ${this.pages.size} catalog pages, ${this.items.size} catalog items`);
        this.logger.info(`Root pages: ${rootPages.length} (${rootPages.map(p => p.getCaption()).join(', ')})`);
    }

    private async loadPages(): Promise<void> {
        const db = emulator.getDatabase();

        try {
            const rows = await db.query<CatalogPageRow[]>(
                `SELECT * FROM catalog_pages ORDER BY order_num`
            );

            for (const row of rows) {
                const data: CatalogPageData = {
                    id: row.id,
                    parentId: parseInt(row.parent_id, 10) || -1,
                    captionSave: row.caption_save || '',
                    caption: row.caption || '',
                    iconColor: row.icon_color || 1,
                    iconImage: row.icon_image || 1,
                    visible: row.visible === '1',
                    enabled: row.enabled === '1',
                    minRank: row.min_rank || 1,
                    clubOnly: row.club_only === '1',
                    vipOnly: row.vip_only === '1',
                    orderNum: row.order_num || 0,
                    pageLayout: row.page_layout || 'default_3x3',
                    pageHeadline: row.page_headline || '',
                    pageTeaser: row.page_teaser || '',
                    pageSpecial: row.page_special || '',
                    pageText1: row.page_text1 || '',
                    pageText2: row.page_text2 || '',
                    pageTextDetails: row.page_text_details || '',
                    pageTextTeaser: row.page_text_teaser || ''
                };

                const page = new CatalogPage(data);
                this.pages.set(page.getId(), page);
            }
        } catch (error) {
            this.logger.error('Failed to load catalog pages:', error);
        }
    }

    private async loadItems(): Promise<void> {
        const db = emulator.getDatabase();

        try {
            const rows = await db.query<CatalogItemRow[]>(
                `SELECT * FROM catalog_items ORDER BY order_number`
            );

            for (const row of rows) {
                const pageId = parseInt(row.page_id, 10) || 0;

                const data: CatalogItemData = {
                    id: row.id,
                    pageId: pageId,
                    itemIds: row.item_ids || '',
                    catalogName: row.catalog_name || '',
                    costCredits: row.cost_credits || 0,
                    costPoints: row.cost_points || 0,
                    pointsType: row.points_type || 0,
                    amount: row.amount || 1,
                    limitedSells: row.limited_sells || 0,
                    limitedStack: row.limited_stack || 0,
                    clubOnly: row.club_only === '1',
                    haveOffer: row.have_offer === '1',
                    offerId: row.offer_id || 0,
                    orderNum: row.order_number || 0,
                    extraData: row.extradata || '',
                    songId: row.song_id || 0
                };

                const item = new CatalogItem(data);

                // Link base item definitions
                const baseItems = [];
                for (const itemId of item.getItemIdArray()) {
                    const definition = this.itemManager.getDefinition(itemId);
                    if (definition) {
                        baseItems.push(definition);
                    }
                }
                item.setBaseItems(baseItems);

                this.items.set(item.getId(), item);

                // Add to page
                const page = this.pages.get(item.getPageId());
                if (page) {
                    page.addItem(item);
                }
            }
        } catch (error) {
            this.logger.error('Failed to load catalog items:', error);
        }
    }

    private async loadLimitedSold(): Promise<void> {
        const db = emulator.getDatabase();

        try {
            const rows = await db.query<LimitedSoldRow[]>(
                `SELECT catalog_item_id, COUNT(*) as sold_count FROM catalog_items_limited GROUP BY catalog_item_id`
            );

            for (const row of rows) {
                const item = this.items.get(row.catalog_item_id);
                if (item) {
                    item.setLimitedSold(row.sold_count);
                }
            }
        } catch (error) {
            this.logger.error('Failed to load limited sold counts:', error);
        }
    }

    private buildPageHierarchy(): void {
        // Build parent-child relationships
        for (const page of this.pages.values()) {
            if (page.getParentId() > 0) {
                const parent = this.pages.get(page.getParentId());
                if (parent) {
                    parent.addChild(page);
                }
            }
        }
    }

    // Get root pages (parent_id = -1 or 0)
    public getRootPages(): CatalogPage[] {
        const roots: CatalogPage[] = [];
        for (const page of this.pages.values()) {
            if (page.getParentId() <= 0) {
                roots.push(page);
            }
        }
        return roots.sort((a, b) => a.getOrderNum() - b.getOrderNum());
    }

    // Get page by ID
    public getPage(id: number): CatalogPage | undefined {
        return this.pages.get(id);
    }

    // Get item by ID
    public getItem(id: number): CatalogItem | undefined {
        return this.items.get(id);
    }

    // Get all pages
    public getPages(): CatalogPage[] {
        return Array.from(this.pages.values());
    }

    // Get all items
    public getItems(): CatalogItem[] {
        return Array.from(this.items.values());
    }

    // Get pages accessible by user
    public getAccessiblePages(rank: number, hasClub: boolean, isVip: boolean): CatalogPage[] {
        return this.getPages().filter(page => page.canAccess(rank, hasClub, isVip));
    }

    // Record limited item sale
    public async recordLimitedSale(catalogItemId: number, userId: number, inventoryItemId: number): Promise<number> {
        const item = this.items.get(catalogItemId);
        if (!item || !item.isLimited()) return 0;

        const limitedNumber = item.getLimitedSold() + 1;
        item.incrementSold();

        const db = emulator.getDatabase();
        try {
            await db.execute(
                `INSERT INTO catalog_items_limited (catalog_item_id, number, user_id, timestamp, item_id) VALUES (?, ?, ?, ?, ?)`,
                [catalogItemId, limitedNumber, userId, Math.floor(Date.now() / 1000), inventoryItemId]
            );
        } catch (error) {
            this.logger.error('Failed to record limited sale:', error);
        }

        return limitedNumber;
    }
}
