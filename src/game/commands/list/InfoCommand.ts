/**
 * InfoCommand - Show emulator information (like Java's AboutCommand)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { emulator } from '../../../core/Emulator';
import { game } from '../../GameEnvironment';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class InfoCommand extends Command {
    constructor() {
        super('info', 'Emülatör bilgilerini gösterir', 'info');
        this.aliases = ['about', 'server', 'online'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        // Calculate uptime
        const uptimeMs = emulator.getUptime();
        const seconds = Math.floor(uptimeMs / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        // Get statistics
        const onlineUsers = emulator.getGameServer().getClientCount();
        const itemDefinitions = game.getItemManager().getDefinitionCount();

        // Memory usage
        const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const memTotal = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);

        const uptimeStr = `${days} gün, ${hours} saat, ${minutes} dakika, ${secs} saniye`;

        const content =
            `<b>Arcane Emulator v1.0.0</b>\r` +
            `<b>TypeScript/Bun Habbo Emulator</b>\r\r` +
            `<b>Hotel İstatistikleri</b>\r` +
            `- Online Kullanıcı: ${onlineUsers}\r` +
            `- Eşya Tanımı: ${itemDefinitions}\r\r` +
            `<b>Sunucu İstatistikleri</b>\r` +
            `- Uptime: ${uptimeStr}\r` +
            `- RAM Kullanımı: ${memUsed}/${memTotal} MB\r` +
            `- CPU Çekirdek: ${navigator?.hardwareConcurrency || 'N/A'}\r` +
            `- Platform: Bun Runtime\r\r` +
            `<b>Arcane Team tarafından geliştirilmiştir.</b>`;

        const message = new ServerMessage(Outgoing.NotificationDialogComposer);
        message.appendString('furni_placement_error');
        message.appendInt(4); // Keys count
        message.appendString('image');
        message.appendString('${image.library.url}notifications/fig_info.png');
        message.appendString('message');
        message.appendString(content);
        message.appendString('title');
        message.appendString('Arcane Emulator');

        client.send(message);
        return true;
    }
}
