/**
 * Command - Base class for chat commands
 */

import type { Habbo } from '../users/Habbo';
import type { Room } from '../rooms/Room';
import type { GameClient } from '../../network/GameClient';
import type { WebSocketClient } from '../../network/WebSocketClient';

export type AnyClient = GameClient | WebSocketClient;

export enum CommandPermission {
    USER = 0,        // Normal users
    VIP = 1,         // VIP users
    HELPER = 2,      // Helpers
    MODERATOR = 3,   // Moderators
    ADMINISTRATOR = 4, // Administrators
    OWNER = 5        // Server owner
}

export abstract class Command {
    protected name: string;
    protected description: string;
    protected usage: string;
    protected aliases: string[] = [];
    protected permission: CommandPermission = CommandPermission.USER;

    constructor(name: string, description: string, usage: string = '') {
        this.name = name;
        this.description = description;
        this.usage = usage;
    }

    /**
     * Execute the command
     */
    public abstract execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean>;

    /**
     * Check if user has permission to use this command
     */
    public hasPermission(habbo: Habbo): boolean {
        return habbo.getRank() >= this.permission;
    }

    public getName(): string { return this.name; }
    public getDescription(): string { return this.description; }
    public getUsage(): string { return this.usage; }
    public getAliases(): string[] { return this.aliases; }
    public getPermission(): CommandPermission { return this.permission; }
}
