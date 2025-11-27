/**
 * RoomAlertCommand - Send alert to all users in current room (Staff only)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { commandManager } from '../CommandManager';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class RoomAlertCommand extends Command {
    constructor() {
        super('ra', 'Odadaki kullanıcılara mesaj gönderir', 'ra <mesaj>');
        this.aliases = ['roomalert', 'roommessage'];
        this.permission = CommandPermission.MODERATOR;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length === 0) {
            return false; // Show usage
        }

        const alertMessage = args.join(' ');

        // Create alert message
        const response = new ServerMessage(Outgoing.BroadcastMessageAlertComposer);
        response.appendString(alertMessage + '\r\r- ' + habbo.getUsername());
        response.appendString(''); // URL

        // Send to all users in room
        room.sendToAll(response);

        commandManager.sendWhisper(client, habbo, room,
            `Oda mesajı gönderildi: ${alertMessage}`
        );

        return true;
    }
}
