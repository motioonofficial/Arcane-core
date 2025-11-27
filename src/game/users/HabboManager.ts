/**
 * HabboManager - Manages online Habbos
 */

import { Logger } from '../../utils/Logger';
import type { Habbo } from './Habbo';

export class HabboManager {
    private logger = new Logger('HabboManager');
    private onlineHabbos: Map<number, Habbo> = new Map();
    private habbosByUsername: Map<string, Habbo> = new Map();

    /**
     * Add a Habbo to the online list
     */
    public addHabbo(habbo: Habbo): void {
        this.onlineHabbos.set(habbo.getId(), habbo);
        this.habbosByUsername.set(habbo.getUsername().toLowerCase(), habbo);
        this.logger.debug(`Habbo ${habbo.getUsername()} (${habbo.getId()}) is now online`);
    }

    /**
     * Remove a Habbo from the online list
     */
    public removeHabbo(habbo: Habbo): void {
        this.onlineHabbos.delete(habbo.getId());
        this.habbosByUsername.delete(habbo.getUsername().toLowerCase());
        this.logger.debug(`Habbo ${habbo.getUsername()} (${habbo.getId()}) is now offline`);
    }

    /**
     * Get a Habbo by ID
     */
    public getOnlineHabbo(id: number): Habbo | undefined {
        return this.onlineHabbos.get(id);
    }

    /**
     * Get a Habbo by username
     */
    public getOnlineHabboByUsername(username: string): Habbo | undefined {
        return this.habbosByUsername.get(username.toLowerCase());
    }

    /**
     * Check if a Habbo is online
     */
    public isOnline(id: number): boolean {
        return this.onlineHabbos.has(id);
    }

    /**
     * Get all online Habbos
     */
    public getAllOnline(): Habbo[] {
        return Array.from(this.onlineHabbos.values());
    }

    /**
     * Get online count
     */
    public getOnlineCount(): number {
        return this.onlineHabbos.size;
    }
}
