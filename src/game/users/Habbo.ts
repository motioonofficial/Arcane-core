/**
 * Habbo - Represents a logged-in user
 * Contains all user data and state
 */

import type { GameClient } from '../../network/GameClient';
import type { WebSocketClient } from '../../network/WebSocketClient';
import type { Room } from '../rooms/Room';
import type { RoomUnit } from '../rooms/RoomUnit';
import { Logger } from '../../utils/Logger';
import { UserInventory } from '../items/UserInventory';
import { game } from '../GameEnvironment';

export interface HabboData {
    id: number;
    username: string;
    motto: string;
    look: string;
    gender: string;
    credits: number;
    pixels: number;
    points: number;
    rank: number;
    online: string; // enum '0','1','2'
    account_created: number;
    last_login: number;
}

export class Habbo {
    private logger: Logger;
    private client: GameClient | WebSocketClient;

    // User data
    private id: number;
    private username: string = '';
    private motto: string = '';
    private look: string = '';
    private gender: string = 'M';
    private credits: number = 0;
    private pixels: number = 0;
    private points: number = 0;
    private rank: number = 1;
    private accountCreated: number = 0;
    private lastLogin: number = 0;

    // Room state
    private currentRoom: Room | null = null;
    private loadingRoom: number = 0;
    private roomUnit: RoomUnit | null = null;

    // Inventory
    private inventory: UserInventory | null = null;

    // Position (deprecated, use roomUnit)
    private x: number = 0;
    private y: number = 0;
    private z: number = 0;
    private rotation: number = 0;

    constructor(id: number, client: GameClient | WebSocketClient) {
        this.id = id;
        this.client = client;
        this.logger = new Logger(`Habbo:${id}`);

        // Initialize inventory
        const itemManager = game.getItemManager();
        if (itemManager) {
            this.inventory = new UserInventory(this, itemManager);
            this.logger.debug('Inventory initialized');
        } else {
            this.logger.warn('ItemManager not available, inventory not initialized');
        }
    }

    /**
     * Load user data from database row
     */
    public async load(data: HabboData): Promise<void> {
        this.id = data.id;
        this.username = data.username;
        this.motto = data.motto || '';
        this.look = data.look || 'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804-64';
        this.gender = data.gender || 'M';
        this.credits = data.credits || 0;
        this.pixels = data.pixels || 0;
        this.points = data.points || 0;
        this.rank = data.rank || 1;
        this.accountCreated = data.account_created || 0;
        this.lastLogin = data.last_login || 0;
    }

    /**
     * Save user data to database
     */
    public async save(): Promise<void> {
        // TODO: Implement save
    }

    /**
     * Called when user disconnects
     */
    public async dispose(): Promise<void> {
        // TODO: Leave room, save data, etc.
        this.logger.debug('Disposing Habbo');
    }

    // Getters
    public getId(): number {
        return this.id;
    }

    public getClient(): GameClient | WebSocketClient {
        return this.client;
    }

    public getUsername(): string {
        return this.username;
    }

    public getMotto(): string {
        return this.motto;
    }

    public getLook(): string {
        return this.look;
    }

    public getGender(): string {
        return this.gender;
    }

    public getCredits(): number {
        return this.credits;
    }

    public getPixels(): number {
        return this.pixels;
    }

    public getPoints(): number {
        return this.points;
    }

    public getRank(): number {
        return this.rank;
    }

    public getCurrentRoom(): Room | null {
        return this.currentRoom;
    }

    public getCurrentRoomId(): number {
        return this.currentRoom?.getId() || 0;
    }

    public getLoadingRoom(): number {
        return this.loadingRoom;
    }

    public getRoomUnit(): RoomUnit | null {
        return this.roomUnit;
    }

    public getInventory(): UserInventory | null {
        return this.inventory;
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getZ(): number {
        return this.z;
    }

    public getRotation(): number {
        return this.rotation;
    }

    // Setters
    public setMotto(motto: string): void {
        this.motto = motto;
    }

    public setLook(look: string): void {
        this.look = look;
    }

    public setGender(gender: string): void {
        this.gender = gender;
    }

    public setCredits(credits: number): void {
        this.credits = credits;
    }

    public setPixels(pixels: number): void {
        this.pixels = pixels;
    }

    public setPoints(points: number): void {
        this.points = points;
    }

    public setCurrentRoom(room: Room | null): void {
        this.currentRoom = room;
    }

    public setLoadingRoom(roomId: number): void {
        this.loadingRoom = roomId;
    }

    public setRoomUnit(unit: RoomUnit | null): void {
        this.roomUnit = unit;
    }

    public setPosition(x: number, y: number, z: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    // Currency methods
    public addCredits(amount: number): void {
        this.credits += amount;
    }

    public removeCredits(amount: number): boolean {
        if (this.credits < amount) return false;
        this.credits -= amount;
        return true;
    }

    public addPixels(amount: number): void {
        this.pixels += amount;
    }

    public removePixels(amount: number): boolean {
        if (this.pixels < amount) return false;
        this.pixels -= amount;
        return true;
    }

    public addPoints(amount: number): void {
        this.points += amount;
    }

    public removePoints(amount: number): boolean {
        if (this.points < amount) return false;
        this.points -= amount;
        return true;
    }

    // Utility
    public isInRoom(): boolean {
        return this.currentRoom !== null;
    }

    public hasPermission(permission: string): boolean {
        // TODO: Implement permission system
        return this.rank >= 4;
    }

    public hasClub(): boolean {
        // TODO: Implement proper club subscription check
        return this.rank >= 2;
    }

    public isVip(): boolean {
        // TODO: Implement proper VIP check
        return this.rank >= 3;
    }

    /**
     * Get points by type (0 = duckets/pixels, 5 = diamonds, etc.)
     */
    public getPointsByType(type: number): number {
        switch (type) {
            case 0:
                return this.pixels; // Duckets
            case 5:
                return this.points; // Diamonds
            default:
                return this.pixels;
        }
    }

    /**
     * Remove points by type
     */
    public removePointsByType(type: number, amount: number): boolean {
        switch (type) {
            case 0:
                return this.removePixels(amount);
            case 5:
                return this.removePoints(amount);
            default:
                return this.removePixels(amount);
        }
    }
}
