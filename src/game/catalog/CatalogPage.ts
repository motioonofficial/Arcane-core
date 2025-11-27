/**
 * CatalogPage - Represents a catalog page
 */

import type { CatalogItem } from './CatalogItem';

export interface CatalogPageData {
    id: number;
    parentId: number;
    captionSave: string; // page identifier (e.g., 'front_page', 'clothing')
    caption: string; // display name (e.g., 'Front', 'Clothes')
    iconColor: number;
    iconImage: number;
    visible: boolean;
    enabled: boolean;
    minRank: number;
    clubOnly: boolean;
    vipOnly: boolean;
    orderNum: number;
    pageLayout: string;
    pageHeadline: string;
    pageTeaser: string;
    pageSpecial: string;
    pageText1: string;
    pageText2: string;
    pageTextDetails: string;
    pageTextTeaser: string;
}

export class CatalogPage {
    private data: CatalogPageData;
    private items: CatalogItem[] = [];
    private children: CatalogPage[] = [];

    constructor(data: CatalogPageData) {
        this.data = data;
    }

    // Add item to page
    public addItem(item: CatalogItem): void {
        this.items.push(item);
    }

    // Add child page
    public addChild(page: CatalogPage): void {
        this.children.push(page);
    }

    // Get items sorted by order
    public getItems(): CatalogItem[] {
        return this.items.sort((a, b) => a.getOrderNum() - b.getOrderNum());
    }

    // Get children sorted by order
    public getChildren(): CatalogPage[] {
        return this.children.sort((a, b) => a.getOrderNum() - b.getOrderNum());
    }

    // Check if user can access this page
    public canAccess(rank: number, hasClub: boolean, isVip: boolean): boolean {
        if (!this.data.visible || !this.data.enabled) return false;
        if (rank < this.data.minRank) return false;
        if (this.data.clubOnly && !hasClub) return false;
        if (this.data.vipOnly && !isVip) return false;
        return true;
    }

    // Getters
    public getId(): number { return this.data.id; }
    public getParentId(): number { return this.data.parentId; }
    public getCaptionSave(): string { return this.data.captionSave; }
    public getCaption(): string { return this.data.caption; }
    public getIconColor(): number { return this.data.iconColor; }
    public getIconImage(): number { return this.data.iconImage; }
    public isVisible(): boolean { return this.data.visible; }
    public isEnabled(): boolean { return this.data.enabled; }
    public getMinRank(): number { return this.data.minRank; }
    public isClubOnly(): boolean { return this.data.clubOnly; }
    public isVipOnly(): boolean { return this.data.vipOnly; }
    public getOrderNum(): number { return this.data.orderNum; }
    public getPageLayout(): string { return this.data.pageLayout; }
    public getPageHeadline(): string { return this.data.pageHeadline; }
    public getPageTeaser(): string { return this.data.pageTeaser; }
    public getPageSpecial(): string { return this.data.pageSpecial; }
    public getPageText1(): string { return this.data.pageText1; }
    public getPageText2(): string { return this.data.pageText2; }
    public getPageTextDetails(): string { return this.data.pageTextDetails; }
    public getPageTextTeaser(): string { return this.data.pageTextTeaser; }
    public getData(): CatalogPageData { return this.data; }
}
