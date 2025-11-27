/**
 * RequestUserProfileEvent - Get user profile
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';
import { game } from '../../../game/GameEnvironment';

export class RequestUserProfileEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const targetId = this.packet.readInt();
        if (targetId <= 0) return;

        // Try to get online habbo first
        let targetHabbo = game.getHabboManager()?.getOnlineHabbo(targetId);

        let userId = targetId;
        let username = '';
        let look = '';
        let motto = '';
        let accountCreated = 0;
        let achievementScore = 0;
        let friendCount = 0;
        let isOnline = false;
        let lastOnline = 0;

        if (targetHabbo) {
            // Online user
            userId = targetHabbo.getId();
            username = targetHabbo.getUsername();
            look = targetHabbo.getLook();
            motto = targetHabbo.getMotto();
            isOnline = true;
            lastOnline = Math.floor(Date.now() / 1000);
        } else {
            // Offline user - load from database
            const db = emulator.getDatabase();
            const rows = await db.query(
                'SELECT id, username, look, motto, account_created, last_login FROM users WHERE id = ? LIMIT 1',
                [targetId]
            );

            if (rows.length === 0) return;

            const row = rows[0];
            userId = row.id;
            username = row.username;
            look = row.look || '';
            motto = row.motto || '';
            accountCreated = row.account_created || 0;
            lastOnline = row.last_login || 0;
        }

        // Get friend count
        const db = emulator.getDatabase();
        const friendRows = await db.query(
            'SELECT COUNT(*) as count FROM messenger_friendships WHERE user_one_id = ?',
            [userId]
        );
        friendCount = friendRows[0]?.count || 0;

        // Check if friends
        const messenger = habbo.getMessenger();
        const isFriend = messenger?.getFriend(userId) !== undefined;

        // Check if friend request sent
        let friendRequestSent = false;
        const requestRows = await db.query(
            'SELECT id FROM messenger_friendrequests WHERE user_from_id = ? AND user_to_id = ? LIMIT 1',
            [habbo.getId(), userId]
        );
        friendRequestSent = requestRows.length > 0;

        // Format date
        const createdDate = new Date((accountCreated || Math.floor(Date.now() / 1000)) * 1000);
        const dateStr = `${createdDate.getDate().toString().padStart(2, '0')}-${(createdDate.getMonth() + 1).toString().padStart(2, '0')}-${createdDate.getFullYear()}`;

        // Calculate seconds since last online
        const secondsAgo = isOnline ? 0 : Math.floor(Date.now() / 1000) - lastOnline;

        const response = new ServerMessage(Outgoing.UserProfileComposer);
        response.appendInt(userId);
        response.appendString(username);
        response.appendString(look);
        response.appendString(motto);
        response.appendString(dateStr); // Account created date
        response.appendInt(achievementScore);
        response.appendInt(friendCount);
        response.appendBoolean(isFriend); // Is friend
        response.appendBoolean(friendRequestSent); // Friend request sent
        response.appendBoolean(isOnline); // Is online
        response.appendInt(0); // Guilds count (no guilds for now)
        response.appendInt(secondsAgo); // Seconds since last online
        response.appendBoolean(true); // Open profile (allow viewing)

        this.client.send(response);
    }
}
