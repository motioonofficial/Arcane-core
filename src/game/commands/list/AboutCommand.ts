/**
 * AboutCommand - Show server information
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class AboutCommand extends Command {
    constructor() {
        super('about', 'Sunucu hakkında bilgi gösterir', 'about');
        this.aliases = ['server', 'version'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const message = new ServerMessage(Outgoing.NotificationDialogComposer);
        message.appendString('furni_placement_error'); // Dialog type
        message.appendInt(2); // Keys count
        message.appendString('message');
        message.appendString(
            '<b>Arcane Emulator</b>\r\r' +
            'TypeScript/Bun tabanlı Habbo emülatörü\r\r' +
            '<b>Versiyon:</b> 1.0.0\r' +
            '<b>Platform:</b> Bun Runtime\r\r' +
            'Geliştirici: Arcane Team'
        );
        message.appendString('title');
        message.appendString('Sunucu Bilgisi');

        client.send(message);
        return true;
    }
}
