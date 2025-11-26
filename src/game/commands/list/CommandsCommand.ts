/**
 * CommandsCommand - Show available commands
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { commandManager } from '../CommandManager';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class CommandsCommand extends Command {
    constructor() {
        super('commands', 'Kullanılabilir komutları listeler', 'commands');
        this.aliases = ['cmds', 'help'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commands = commandManager.getCommands();
        const prefix = commandManager.getCommandPrefix();

        // Filter commands user has permission for
        const availableCommands = commands.filter(cmd => cmd.hasPermission(habbo));

        // Group by permission level
        const userCmds = availableCommands.filter(c => c.getPermission() === CommandPermission.USER);
        const modCmds = availableCommands.filter(c => c.getPermission() === CommandPermission.MODERATOR);
        const adminCmds = availableCommands.filter(c => c.getPermission() >= CommandPermission.ADMINISTRATOR);

        let content = '<b>Kullanılabilir Komutlar</b>\r\r';

        if (userCmds.length > 0) {
            content += '<b>Genel Komutlar:</b>\r';
            for (const cmd of userCmds) {
                content += `${prefix}${cmd.getName()} - ${cmd.getDescription()}\r`;
            }
            content += '\r';
        }

        if (modCmds.length > 0) {
            content += '<b>Moderatör Komutları:</b>\r';
            for (const cmd of modCmds) {
                content += `${prefix}${cmd.getName()} - ${cmd.getDescription()}\r`;
            }
            content += '\r';
        }

        if (adminCmds.length > 0) {
            content += '<b>Admin Komutları:</b>\r';
            for (const cmd of adminCmds) {
                content += `${prefix}${cmd.getName()} - ${cmd.getDescription()}\r`;
            }
        }

        const message = new ServerMessage(Outgoing.NotificationDialogComposer);
        message.appendString('furni_placement_error');
        message.appendInt(2);
        message.appendString('message');
        message.appendString(content);
        message.appendString('title');
        message.appendString('Komutlar');

        client.send(message);
        return true;
    }
}
