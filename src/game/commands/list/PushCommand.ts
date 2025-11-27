/**
 * PushCommand - Push another user away from you
 */

import { Command, CommandPermission, type AnyClient } from '../Command';
import { game } from '../../GameEnvironment';
import { Pathfinder } from '../../rooms/Pathfinder';
import type { Habbo } from '../../users/Habbo';
import type { Room } from '../../rooms/Room';

export class PushCommand extends Command {
    constructor() {
        super('push', 'Bir kullanıcıyı iter', 'push <kullanıcı>');
        this.aliases = ['it', 'ittir'];
        this.permission = CommandPermission.VIP;
    }

    public async execute(client: AnyClient, habbo: Habbo, room: Room | null, args: string[]): Promise<boolean> {
        const commandManager = game.getCommandManager();

        if (!room) {
            commandManager.sendWhisper(client, habbo, room, 'Bir odada olmalısınız.');
            return true;
        }

        if (args.length < 1) {
            commandManager.sendWhisper(client, habbo, room, 'Kullanım: :push <kullanıcı>');
            return true;
        }

        const targetName = args[0];
        const target = room.getHabboByName(targetName);

        if (!target) {
            commandManager.sendWhisper(client, habbo, room, `Kullanıcı bulunamadı: ${targetName}`);
            return true;
        }

        if (target.getId() === habbo.getId()) {
            commandManager.sendWhisper(client, habbo, room, 'Kendinizi itemezsiniz.');
            return true;
        }

        const myUnit = habbo.getRoomUnit();
        const targetUnit = target.getRoomUnit();
        if (!myUnit || !targetUnit) return true;

        // Check if target is in front of me
        const layout = room.getLayout();
        if (!layout) return true;

        const frontTile = layout.getTileInFrontOf(myUnit.getX(), myUnit.getY(), myUnit.getBodyRotation());
        if (!frontTile || frontTile.getX() !== targetUnit.getX() || frontTile.getY() !== targetUnit.getY()) {
            commandManager.sendWhisper(client, habbo, room, `${targetName} önünüzde değil.`);
            return true;
        }

        // Find tile in front of target (same direction as me)
        const pushTile = layout.getTileInFrontOf(targetUnit.getX(), targetUnit.getY(), myUnit.getBodyRotation());
        if (!pushTile || !pushTile.isWalkable()) {
            commandManager.sendWhisper(client, habbo, room, `${targetName} itilemez, arkasında engel var.`);
            return true;
        }

        // Move target to push tile
        const path = Pathfinder.findPath(room, targetUnit.getX(), targetUnit.getY(), pushTile.getX(), pushTile.getY());
        if (path.length > 0) {
            targetUnit.setGoal(pushTile.getX(), pushTile.getY());
            targetUnit.setPath(path);
        } else {
            // Direct move if no path
            targetUnit.setGoal(pushTile.getX(), pushTile.getY());
            targetUnit.setPath([pushTile]);
        }

        // Send chat message
        room.sendChat(habbo, `*${targetName} kullanıcısını iter*`, 0, 0);
        return true;
    }
}
