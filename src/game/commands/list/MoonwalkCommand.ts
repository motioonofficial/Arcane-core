/**
 * MoonwalkCommand - Toggle moonwalk (walk backwards)
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class MoonwalkCommand extends Command {
    constructor() {
        super('moonwalk', 'Moonwalk modunu açar/kapatır', 'moonwalk');
        this.aliases = ['mw'];
        this.permission = CommandPermission.VIP;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        // TODO: Implement moonwalk in RoomUnit
        commandManager.sendWhisper(client, habbo, room, 'Moonwalk henüz desteklenmiyor.');
        return true;
    }
}
