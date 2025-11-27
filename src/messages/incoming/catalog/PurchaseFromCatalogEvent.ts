/**
 * PurchaseFromCatalogEvent - Purchase item from catalog
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { game } from '../../../game/GameEnvironment';
import { emulator } from '../../../core/Emulator';
import { PurchaseOkComposer } from '../../composers/catalog/PurchaseOkComposer';
import { PurchaseErrorComposer, PurchaseError } from '../../composers/catalog/PurchaseErrorComposer';
import { NotEnoughBalanceComposer } from '../../composers/catalog/NotEnoughBalanceComposer';
import { InventoryRefreshComposer } from '../../composers/catalog/InventoryRefreshComposer';
import { AddItemToInventoryComposer } from '../../composers/catalog/AddItemToInventoryComposer';
import { InventoryItem, type InventoryItemData } from '../../../game/items/InventoryItem';

export class PurchaseFromCatalogEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const pageId = this.packet.readInt();
        const itemId = this.packet.readInt();
        const extraData = this.packet.readString();
        const amount = this.packet.readInt();

        const catalogManager = game.getCatalogManager();
        const itemManager = game.getItemManager();

        // Get catalog page
        const page = catalogManager.getPage(pageId);
        if (!page) {
            this.sendError(PurchaseError.CATALOG_PAGE_EXPIRED);
            return;
        }

        // Check page access
        if (!page.canAccess(habbo.getRank(), habbo.hasClub(), habbo.isVip())) {
            this.sendError(PurchaseError.CATALOG_PAGE_EXPIRED);
            return;
        }

        // Get catalog item
        const catalogItem = catalogManager.getItem(itemId);
        if (!catalogItem || catalogItem.getPageId() !== pageId) {
            this.sendError(PurchaseError.INVALID_ITEM);
            return;
        }

        // Check if club only
        if (catalogItem.isClubOnly() && !habbo.hasClub()) {
            this.sendError(PurchaseError.NO_CLUB);
            return;
        }

        // Check if limited and available
        if (catalogItem.isLimited() && !catalogItem.isAvailable()) {
            this.sendError(PurchaseError.SOLD_OUT);
            return;
        }

        // Calculate total cost
        const purchaseAmount = catalogItem.hasOffer() ? Math.max(1, Math.min(amount, 100)) : 1;
        const totalCredits = catalogItem.getCostCredits() * purchaseAmount;
        const totalPoints = catalogItem.getCostPoints() * purchaseAmount;
        const pointsType = catalogItem.getPointsType();

        // Check if user has enough currency
        if (totalCredits > 0 && habbo.getCredits() < totalCredits) {
            this.client.send(new NotEnoughBalanceComposer(true, false, 0).compose());
            return;
        }

        if (totalPoints > 0 && habbo.getPointsByType(pointsType) < totalPoints) {
            this.client.send(new NotEnoughBalanceComposer(false, true, pointsType).compose());
            return;
        }

        // Deduct currency
        if (totalCredits > 0) {
            habbo.removeCredits(totalCredits);
            this.sendCreditsUpdate();
        }

        if (totalPoints > 0) {
            habbo.removePointsByType(pointsType, totalPoints);
            this.sendPointsUpdate();
        }

        // Create items in inventory
        const inventory = habbo.getInventory();
        if (!inventory) {
            this.sendError(PurchaseError.UNKNOWN);
            return;
        }

        await inventory.load();

        const db = emulator.getDatabase();
        let lastItem: InventoryItem | null = null;

        // For each item in the catalog offer
        for (const baseItem of catalogItem.getBaseItems()) {
            // For each purchase amount
            for (let i = 0; i < purchaseAmount * catalogItem.getAmount(); i++) {
                try {
                    // Determine extra data
                    let itemExtraData = catalogItem.getExtraData() || extraData || '0';

                    // Handle limited edition
                    let limitedNumber = 0;
                    let limitedStack = 0;
                    let limitedData = '0:0';

                    if (catalogItem.isLimited()) {
                        limitedStack = catalogItem.getLimitedStack();
                        limitedNumber = await catalogManager.recordLimitedSale(catalogItem.getId(), habbo.getId(), 0);
                        limitedData = `${limitedNumber}:${limitedStack}`;
                    }

                    // Insert into database (limited_data format: "number:stack")
                    const result = await db.execute(
                        `INSERT INTO items (user_id, room_id, item_id, extra_data, limited_data) VALUES (?, 0, ?, ?, ?)`,
                        [habbo.getId(), baseItem.getId(), itemExtraData, limitedData]
                    );

                    const insertId = result.insertId;

                    // Create inventory item
                    const itemData: InventoryItemData = {
                        id: insertId,
                        userId: habbo.getId(),
                        baseItemId: baseItem.getId(),
                        extraData: itemExtraData,
                        limitedNumber: limitedNumber,
                        limitedStack: limitedStack
                    };

                    const newItem = new InventoryItem(itemData, baseItem);
                    inventory.addItem(newItem);
                    lastItem = newItem;

                    // Update limited sale record with item ID
                    if (catalogItem.isLimited() && limitedNumber > 0) {
                        await db.execute(
                            `UPDATE catalog_items_limited SET item_id = ? WHERE catalog_item_id = ? AND number = ?`,
                            [insertId, catalogItem.getId(), limitedNumber]
                        );
                    }

                } catch (error) {
                    console.error('Failed to create inventory item:', error);
                    this.sendError(PurchaseError.UNKNOWN);
                    return;
                }
            }
        }

        // Update user currency in database
        await this.saveUserCurrency(habbo.getId(), habbo.getCredits(), habbo.getPixels(), habbo.getPoints());

        // Send success response
        this.client.send(new PurchaseOkComposer(catalogItem, lastItem).compose());

        // Notify inventory update
        if (lastItem) {
            this.client.send(new AddItemToInventoryComposer(lastItem).compose());
        }
        this.client.send(new InventoryRefreshComposer().compose());
    }

    private sendError(error: PurchaseError): void {
        this.client.send(new PurchaseErrorComposer(error).compose());
    }

    private sendCreditsUpdate(): void {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const credits = new ServerMessage(Outgoing.CreditBalanceComposer);
        credits.appendString(habbo.getCredits().toString());
        this.client.send(credits);
    }

    private sendPointsUpdate(): void {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const points = new ServerMessage(Outgoing.ActivityPointsComposer);
        points.appendInt(2); // Number of point types

        // Duckets (type 0)
        points.appendInt(0);
        points.appendInt(habbo.getPixels());

        // Diamonds (type 5)
        points.appendInt(5);
        points.appendInt(habbo.getPoints());

        this.client.send(points);
    }

    private async saveUserCurrency(userId: number, credits: number, pixels: number, points: number): Promise<void> {
        const db = emulator.getDatabase();
        try {
            await db.execute(
                `UPDATE users SET credits = ?, pixels = ?, points = ? WHERE id = ?`,
                [credits, pixels, points, userId]
            );
        } catch (error) {
            console.error('Failed to save user currency:', error);
        }
    }
}
