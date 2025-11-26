/**
 * CommandManager - Handles chat commands
 */

import { Logger } from '../../utils/Logger';
import { Command } from './Command';
import type { Habbo } from '../users/Habbo';
import type { Room } from '../rooms/Room';
import type { GameClient } from '../../network/GameClient';
import type { WebSocketClient } from '../../network/WebSocketClient';

type AnyClient = GameClient | WebSocketClient;

// Import commands
import { AboutCommand } from './list/AboutCommand';
import { InfoCommand } from './list/InfoCommand';
import { CoordsCommand } from './list/CoordsCommand';
import { PickallCommand } from './list/PickallCommand';
import { HotelAlertCommand } from './list/HotelAlertCommand';
import { CommandsCommand } from './list/CommandsCommand';
import { SitCommand } from './list/SitCommand';

export class CommandManager {
    private logger = new Logger('CommandManager');
    private commands: Map<string, Command> = new Map();
    private commandPrefix: string = ':';

    public async initialize(): Promise<void> {
        this.registerCommands();
        this.logger.info(`Registered ${this.commands.size} commands`);
    }

    private registerCommands(): void {
        // User commands
        this.register(new AboutCommand());
        this.register(new InfoCommand());
        this.register(new CoordsCommand());
        this.register(new CommandsCommand());
        this.register(new SitCommand());

        // Room owner commands
        this.register(new PickallCommand());

        // Staff commands
        this.register(new HotelAlertCommand());
    }

    private register(command: Command): void {
        // Register main command name
        this.commands.set(command.getName().toLowerCase(), command);

        // Register aliases
        for (const alias of command.getAliases()) {
            this.commands.set(alias.toLowerCase(), command);
        }
    }

    /**
     * Try to handle a message as a command
     * @returns true if message was a command, false otherwise
     */
    public async handleCommand(client: AnyClient, habbo: Habbo, room: Room | null, message: string): Promise<boolean> {
        // Check if message starts with command prefix
        if (!message.startsWith(this.commandPrefix)) {
            return false;
        }

        // Parse command and args
        const parts = message.substring(this.commandPrefix.length).split(' ');
        const commandName = parts[0]?.toLowerCase();
        const args = parts.slice(1);

        if (!commandName) return false;

        // Find command
        const command = this.commands.get(commandName);
        if (!command) {
            return false; // Unknown command, treat as normal chat
        }

        // Check permission
        if (!command.hasPermission(habbo)) {
            this.sendWhisper(client, habbo, room, 'Bu komutu kullanma yetkiniz yok.');
            return true;
        }

        try {
            const success = await command.execute(client, habbo, room, args);
            if (!success && command.getUsage()) {
                this.sendWhisper(client, habbo, room, `Kullanım: ${this.commandPrefix}${command.getUsage()}`);
            }
        } catch (error) {
            this.logger.error(`Error executing command ${commandName}:`, error);
            this.sendWhisper(client, habbo, room, 'Komut çalıştırılırken bir hata oluştu.');
        }

        return true;
    }

    /**
     * Send whisper message to user (only they see it)
     */
    public sendWhisper(client: AnyClient, habbo: Habbo, room: Room | null, message: string): void {
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        const { ServerMessage } = require('../../messages/ServerMessage');
        const { Outgoing } = require('../../messages/Headers');

        const response = new ServerMessage(Outgoing.WhisperComposer);
        response.appendInt(roomUnit.getId());
        response.appendString(message);
        response.appendInt(0); // Emotion
        response.appendInt(34); // Bubble style (bot/system)
        response.appendInt(0); // Links count
        response.appendInt(message.length);

        client.send(response);
    }

    public getCommands(): Command[] {
        // Return unique commands (no duplicates from aliases)
        const seen = new Set<string>();
        const commands: Command[] = [];

        for (const command of this.commands.values()) {
            if (!seen.has(command.getName())) {
                seen.add(command.getName());
                commands.push(command);
            }
        }

        return commands;
    }

    public getCommandPrefix(): string {
        return this.commandPrefix;
    }
}

// Singleton instance
export const commandManager = new CommandManager();
