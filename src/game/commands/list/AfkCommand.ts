/**
 * AfkCommand - Toggle AFK mode with idle animation and motto update
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import { game } from '../../GameEnvironment';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

// Popular AFK/Idle effects
const AFK_EFFECTS = [
    185, // Zzz sleep effect
    1,   // Basic idle
    8,   // Ghost
];

export class AfkCommand extends Command {
    constructor() {
        super('afk', 'AFK modunu açar/kapatır', 'afk');
        this.aliases = ['away', 'brb'];
        this.permission = CommandPermission.USER;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return true;

        // Toggle AFK mode
        const isAfk = roomUnit.isAfk();

        if (isAfk) {
            // Disable AFK mode
            roomUnit.setAfk(false);

            // Restore original motto
            const originalMotto = roomUnit.getOriginalMotto();
            habbo.setMotto(originalMotto);

            // Remove effect
            roomUnit.setEffectId(0);
            this.sendEffectUpdate(room, roomUnit.getId(), 0);

            // Send motto update to room
            this.sendMottoUpdate(room, habbo, originalMotto);

            commandManager.sendWhisper(client, habbo, room, 'AFK modu kapatıldı.');
        } else {
            // Enable AFK mode
            roomUnit.setAfk(true);

            // Save original motto
            roomUnit.setOriginalMotto(habbo.getMotto());

            // Set AFK motto
            const afkMotto = `[AFK] 0 dk - ${habbo.getMotto()}`;
            habbo.setMotto(afkMotto);

            // Send motto update to room
            this.sendMottoUpdate(room, habbo, afkMotto);

            // Add idle effect (185 = Zzz sleep bubble)
            const effectId = 185;
            roomUnit.setEffectId(effectId);
            this.sendEffectUpdate(room, roomUnit.getId(), effectId);

            // Make user sit if standing
            if (!roomUnit.hasStatus('sit') && !roomUnit.hasStatus('lay')) {
                roomUnit.sit(0.5);
            }

            commandManager.sendWhisper(client, habbo, room, 'AFK modu açıldı. Yürüyerek veya :afk yazarak kapatabilirsiniz.');
        }

        return true;
    }

    private sendMottoUpdate(room: Room, habbo: Habbo, motto: string): void {
        // Update user data in room
        const response = new ServerMessage(Outgoing.RoomUserDataComposer);
        response.appendInt(1); // Count
        response.appendInt(habbo.getId());
        response.appendString(habbo.getLook());
        response.appendString(habbo.getGender());
        response.appendString(motto);
        response.appendInt(0); // Achievement score

        room.sendToAll(response);
    }

    private sendEffectUpdate(room: Room, roomUnitId: number, effectId: number): void {
        const effect = new ServerMessage(Outgoing.AvatarEffectComposer);
        effect.appendInt(roomUnitId);
        effect.appendInt(effectId);
        effect.appendInt(0); // Delay

        room.sendToAll(effect);
    }
}
