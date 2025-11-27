/**
 * RequestProfileFriendsEvent - Get user's friends for profile
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';

export class RequestProfileFriendsEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const userId = this.packet.readInt();
        if (userId <= 0) return;

        // Get user's friends from database
        const db = emulator.getDatabase();
        const rows = await db.query(
            `SELECT u.id, u.username, u.look
            FROM messenger_friendships mf
            INNER JOIN users u ON mf.user_two_id = u.id
            WHERE mf.user_one_id = ?
            LIMIT 50`,
            [userId]
        );

        const response = new ServerMessage(Outgoing.ProfileFriendsComposer);
        response.appendInt(userId);
        response.appendInt(rows.length);

        for (const row of rows) {
            response.appendInt(row.id);
            response.appendString(row.username);
            response.appendString(row.look || '');
        }

        this.client.send(response);
    }
}
