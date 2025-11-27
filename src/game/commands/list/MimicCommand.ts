/**
 * MimicCommand - Copy another user's look
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import { ServerMessage } from '../../../messages/ServerMessage';
import { Outgoing } from '../../../messages/Headers';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class MimicCommand extends Command {
    constructor() {
        super('mimic', 'Başka bir kullanıcının görünümünü kopyalar', 'mimic <kullanıcı>');
        this.aliases = ['copy', 'kopyala'];
        this.permission = CommandPermission.VIP;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :mimic <kullanıcı>');
            return true;
        }

        const targetName = args[0];
        const target = room.getHabboByName(targetName);

        if (!target) {
            commandManager.sendWhisper(client, habbo, room, `Kullanıcı bulunamadı: ${targetName}`);
            return true;
        }

        if (target.getId() === habbo.getId()) {
            commandManager.sendWhisper(client, habbo, room, 'Kendinizi kopyalayamazsınız.');
            return true;
        }

        // Copy look and gender
        const newLook = target.getLook();
        const newGender = target.getGender();

        habbo.setLook(newLook);
        habbo.setGender(newGender);

        // Send updated look to client
        const userDataResponse = new ServerMessage(Outgoing.UserDataComposer);
        userDataResponse.appendInt(habbo.getId());
        userDataResponse.appendString(habbo.getUsername());
        userDataResponse.appendString(newLook);
        userDataResponse.appendString(newGender.toUpperCase());
        userDataResponse.appendString(habbo.getMotto());
        userDataResponse.appendString(''); // Real name
        userDataResponse.appendBoolean(false); // Direct mail
        userDataResponse.appendInt(0); // Respect count
        userDataResponse.appendInt(0); // Respect given today
        userDataResponse.appendInt(0); // Pet respect given today
        userDataResponse.appendBoolean(false); // Stream publishing allowed
        userDataResponse.appendString(''); // Last access
        userDataResponse.appendBoolean(false); // Name change allowed
        userDataResponse.appendBoolean(false); // Safety locked
        client.send(userDataResponse);

        // Update look in room for all users
        const roomUnit = habbo.getRoomUnit();
        if (roomUnit) {
            const roomUserData = new ServerMessage(Outgoing.RoomUserDataComposer);
            roomUserData.appendInt(1);
            roomUserData.appendInt(habbo.getId());
            roomUserData.appendString(newLook);
            roomUserData.appendString(newGender.toUpperCase());
            roomUserData.appendString(habbo.getMotto());
            roomUserData.appendInt(0); // Achievement score
            room.sendToAll(roomUserData);
        }

        commandManager.sendWhisper(client, habbo, room, `${targetName} kullanıcısının görünümü kopyalandı.`);
        return true;
    }
}
