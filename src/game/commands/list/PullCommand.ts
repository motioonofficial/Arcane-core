/**
 * PullCommand - Pull another user towards you
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import { Pathfinder } from '../../rooms/Pathfinder';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class PullCommand extends Command {
    constructor() {
        super('pull', 'Bir kullanıcıyı yanınıza çeker', 'pull <kullanıcı>');
        this.aliases = ['cek', 'çek'];
        this.permission = CommandPermission.VIP;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :pull <kullanıcı>');
            return true;
        }

        const targetName = args[0];
        const target = room.getHabboByName(targetName);

        if (!target) {
            commandManager.sendWhisper(client, habbo, room, `Kullanıcı bulunamadı: ${targetName}`);
            return true;
        }

        if (target.getId() === habbo.getId()) {
            commandManager.sendWhisper(client, habbo, room, 'Kendinizi çekemezsiniz.');
            return true;
        }

        const myUnit = habbo.getRoomUnit();
        const targetUnit = target.getRoomUnit();
        if (!myUnit || !targetUnit) return true;

        // Check distance
        const distanceX = Math.abs(targetUnit.getX() - myUnit.getX());
        const distanceY = Math.abs(targetUnit.getY() - myUnit.getY());

        if (distanceX > 3 || distanceY > 3) {
            commandManager.sendWhisper(client, habbo, room, `${targetName} çok uzakta.`);
            return true;
        }

        // Find tile in front of me
        const layout = room.getLayout();
        if (!layout) return true;

        const frontTile = layout.getTileInFrontOf(myUnit.getX(), myUnit.getY(), myUnit.getBodyRotation());
        if (!frontTile || !frontTile.isWalkable()) {
            commandManager.sendWhisper(client, habbo, room, 'Önünüzde uygun alan yok.');
            return true;
        }

        // Move target to front tile
        const path = Pathfinder.findPath(room, targetUnit.getX(), targetUnit.getY(), frontTile.getX(), frontTile.getY());
        if (path.length > 0) {
            targetUnit.setGoal(frontTile.getX(), frontTile.getY());
            targetUnit.setPath(path);
        } else {
            // Direct move if no path
            targetUnit.setGoal(frontTile.getX(), frontTile.getY());
            targetUnit.setPath([frontTile]);
        }

        // Send chat message
        room.sendChat(habbo, `*${targetName} kullanıcısını çeker*`, 0, 0);
        return true;
    }
}
