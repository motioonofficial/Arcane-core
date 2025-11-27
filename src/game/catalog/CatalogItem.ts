/**
 * CatalogItem - Represents an item in the catalog
 */

import type { FurnitureDefinition } from '../items/FurnitureDefinition';

export interface CatalogItemData {
    id: number;
    pageId: number;
    itemIds: string; // Comma-separated item IDs for bundles
    catalogName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number; // 0 = duckets, 5 = diamonds, etc.
    amount: number;
    limitedSells: number;
    limitedStack: number;
    clubOnly: boolean;
    haveOffer: boolean;
    offerId: number;
    orderNum: number;
    extraData: string;
    songId: number;
}

export class CatalogItem {
    private data: CatalogItemData;
    private baseItems: FurnitureDefinition[] = [];
    private limitedSold: number = 0;

    constructor(data: CatalogItemData) {
        this.data = data;
    }

    // Set base item definitions
    public setBaseItems(items: FurnitureDefinition[]): void {
        this.baseItems = items;
    }

    // Get first base item (for single items)
    public getBaseItem(): FurnitureDefinition | undefined {
        return this.baseItems[0];
    }

    // Get all base items (for bundles)
    public getBaseItems(): FurnitureDefinition[] {
        return this.baseItems;
    }

    // Check if this is a bundle
    public isBundle(): boolean {
        return this.baseItems.length > 1;
    }

    // Check if item is limited edition
    public isLimited(): boolean {
        return this.data.limitedStack > 0;
    }

    // Check if still available (for limited items)
    public isAvailable(): boolean {
        if (!this.isLimited()) return true;
        return this.limitedSold < this.data.limitedStack;
    }

    // Get remaining stock for limited items
    public getRemainingStock(): number {
        if (!this.isLimited()) return -1;
        return this.data.limitedStack - this.limitedSold;
    }

    // Increment sold counter
    public incrementSold(): void {
        this.limitedSold++;
    }

    // Set sold count
    public setLimitedSold(sold: number): void {
        this.limitedSold = sold;
    }

    // Get item IDs as array
    public getItemIdArray(): number[] {
        return this.data.itemIds
            .split(',')
            .filter(id => id.length > 0)
            .map(id => parseInt(id.trim(), 10));
    }

    // Getters
    public getId(): number { return this.data.id; }
    public getPageId(): number { return this.data.pageId; }
    public getItemIds(): string { return this.data.itemIds; }
    public getCatalogName(): string { return this.data.catalogName; }
    public getCostCredits(): number { return this.data.costCredits; }
    public getCostPoints(): number { return this.data.costPoints; }
    public getPointsType(): number { return this.data.pointsType; }
    public getAmount(): number { return this.data.amount; }
    public getLimitedSells(): number { return this.data.limitedSells; }
    public getLimitedStack(): number { return this.data.limitedStack; }
    public getLimitedSold(): number { return this.limitedSold; }
    public isClubOnly(): boolean { return this.data.clubOnly; }
    public hasOffer(): boolean { return this.data.haveOffer; }
    public getOfferId(): number { return this.data.offerId; }
    public getOrderNum(): number { return this.data.orderNum; }
    public getExtraData(): string { return this.data.extraData; }
    public getSongId(): number { return this.data.songId; }
    public getData(): CatalogItemData { return this.data; }
}
