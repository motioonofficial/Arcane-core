/**
 * InfoCommand - Show emulator information (like Java's AboutCommand)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { emulator } from '../../../core/Emulator';
import { game } from '../../GameEnvironment';
import * as os from 'os';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class InfoCommand extends Command {
    constructor() {
        super('info', 'Emülatör bilgilerini gösterir', 'info');
        this.aliases = ['about', 'server', 'online', 'version'];
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

        // CPU info
        const cpuCores = os.cpus().length;

        const uptimeStr = `${days} gün, ${hours} saat, ${minutes} dakika, ${secs} saniye`;

        const content =
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r` +
            `     <b>ARCANE EMULATOR</b>\r` +
            `        <i>v1.0.0</i>\r` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\r` +
            `<b>◆ Hotel İstatistikleri</b>\r` +
            `   ▸ Online Kullanıcı: ${onlineUsers}\r` +
            `   ▸ Eşya Tanımı: ${itemDefinitions}\r\r` +
            `<b>◆ Sunucu İstatistikleri</b>\r` +
            `   ▸ Uptime: ${uptimeStr}\r` +
            `   ▸ RAM: ${memUsed}/${memTotal} MB\r` +
            `   ▸ CPU: ${cpuCores} Çekirdek\r` +
            `   ▸ Platform: Bun Runtime\r\r` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r` +
            `<b>Geliştiriciler:</b> Motioon, beck10s\r` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        const message = new ServerMessage(Outgoing.BroadcastMessageAlertComposer);
        message.appendString(content);
        message.appendString(''); // URL

        client.send(message);
        return true;
    }
}
