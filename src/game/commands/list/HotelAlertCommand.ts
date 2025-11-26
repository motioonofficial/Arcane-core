/**
 * HotelAlertCommand - Send alert to all online users (Staff only)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { commandManager } from '../CommandManager';
import { emulator } from '../../../core/Emulator';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class HotelAlertCommand extends Command {
    constructor() {
        super('ha', 'Tüm kullanıcılara mesaj gönderir', 'ha <mesaj>');
        this.aliases = ['hotelalert', 'broadcast', 'alert'];
        this.permission = CommandPermission.MODERATOR; // Rank 3+
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        if (args.length === 0) {
            return false; // Show usage
        }

        const alertMessage = args.join(' ');

        // Create broadcast message
        const response = new ServerMessage(Outgoing.BroadcastMessageAlertComposer);
        response.appendString(alertMessage + '\r\r- ' + habbo.getUsername());
        response.appendString(''); // URL (empty)

        // Send to all online clients via WebSocketServer
        emulator.getGameServer().broadcastMessage(response);

        commandManager.sendWhisper(client, habbo, room,
            `Hotel Alert gönderildi: ${alertMessage}`
        );

        return true;
    }
}
