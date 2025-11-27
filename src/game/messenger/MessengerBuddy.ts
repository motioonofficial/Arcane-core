/**
 * MessengerBuddy - Represents a friend in the messenger
 */

import type { Habbo } from '../users/Habbo';
import { game } from '../GameEnvironment';

export class MessengerBuddy {
    private id: number;
    private username: string;
    private gender: string = 'M';
    private online: number = 0;
    private look: string = '';
    private motto: string = '';
    private relation: number = 0;
    private categoryId: number = 0;
    private inRoom: boolean = false;
    private userOneId: number = 0;

    constructor(data: {
        id: number;
        username: string;
        gender?: string;
        online?: number;
        look?: string;
        motto?: string;
        relation?: number;
        category?: number;
        user_one_id?: number;
    }) {
        this.id = data.id;
        this.username = data.username;
        this.gender = data.gender || 'M';
        this.online = data.online || 0;
        this.look = data.look || '';
        this.motto = data.motto || '';
        this.relation = data.relation || 0;
        this.categoryId = data.category || 0;
        this.userOneId = data.user_one_id || 0;

        // Check if online and in room
        if (this.online === 1) {
            const habbo = game.getHabboManager()?.getOnlineHabbo(this.id);
            if (habbo) {
                this.inRoom = habbo.getCurrentRoom() !== null;
            }
        }
    }

    /**
     * Create buddy from online Habbo
     */
    public static fromHabbo(habbo: Habbo, userOneId: number): MessengerBuddy {
        return new MessengerBuddy({
            id: habbo.getId(),
            username: habbo.getUsername(),
            gender: habbo.getGender(),
            online: 1,
            look: habbo.getLook(),
            motto: habbo.getMotto(),
            relation: 0,
            category: 0,
            user_one_id: userOneId
        });
    }

    // Getters
    public getId(): number {
        return this.id;
    }

    public getUsername(): string {
        return this.username;
    }

    public setUsername(username: string): void {
        this.username = username;
    }

    public getGender(): string {
        return this.gender;
    }

    public setGender(gender: string): void {
        this.gender = gender;
    }

    public getOnline(): number {
        return this.online;
    }

    public setOnline(online: boolean): void {
        this.online = online ? 1 : 0;
    }

    public getLook(): string {
        return this.look;
    }

    public setLook(look: string): void {
        this.look = look;
    }

    public getMotto(): string {
        return this.motto;
    }

    public setMotto(motto: string): void {
        this.motto = motto;
    }

    public getRelation(): number {
        return this.relation;
    }

    public setRelation(relation: number): void {
        this.relation = relation;
    }

    public getCategoryId(): number {
        return this.categoryId;
    }

    public isInRoom(): boolean {
        return this.inRoom;
    }

    public setInRoom(inRoom: boolean): void {
        this.inRoom = inRoom;
    }

    public getUserOneId(): number {
        return this.userOneId;
    }
}
