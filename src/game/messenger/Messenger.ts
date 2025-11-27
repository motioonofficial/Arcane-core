/**
 * Messenger - Handles friend list, friend requests, and messaging
 */

import { Logger } from '../../utils/Logger';
import { emulator } from '../../core/Emulator';
import { MessengerBuddy } from './MessengerBuddy';
import { FriendRequest } from './FriendRequest';
import { game } from '../GameEnvironment';
import type { Habbo } from '../users/Habbo';
import { ServerMessage } from '../../messages/ServerMessage';
import { Outgoing } from '../../messages/Headers';

export class Messenger {
    private logger: Logger;
    private friends: Map<number, MessengerBuddy> = new Map();
    private friendRequests: Set<FriendRequest> = new Set();
    private habbo: Habbo;

    // Configuration
    public static MAXIMUM_FRIENDS = 200;
    public static MAXIMUM_FRIENDS_HC = 500;

    constructor(habbo: Habbo) {
        this.habbo = habbo;
        this.logger = new Logger(`Messenger:${habbo.getId()}`);
    }

    /**
     * Load friends from database
     */
    public async loadFriends(): Promise<void> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query(
                `SELECT
                    users.id,
                    users.username,
                    users.gender,
                    users.online,
                    users.look,
                    users.motto,
                    messenger_friendships.relation,
                    messenger_friendships.category,
                    messenger_friendships.user_one_id
                FROM messenger_friendships
                INNER JOIN users ON messenger_friendships.user_two_id = users.id
                WHERE user_one_id = ?`,
                [this.habbo.getId()]
            );

            for (const row of rows) {
                if (row.id === this.habbo.getId()) continue;

                const buddy = new MessengerBuddy({
                    id: row.id,
                    username: row.username,
                    gender: row.gender,
                    online: parseInt(row.online) || 0,
                    look: row.look,
                    motto: row.motto,
                    relation: row.relation || 0,
                    category: row.category || 0,
                    user_one_id: row.user_one_id
                });

                this.friends.set(row.id, buddy);
            }

            this.logger.debug(`Loaded ${this.friends.size} friends`);
        } catch (error) {
            this.logger.error('Error loading friends:', error);
        }
    }

    /**
     * Load friend requests from database
     */
    public async loadFriendRequests(): Promise<void> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query(
                `SELECT users.id, users.username, users.look
                FROM messenger_friendrequests
                INNER JOIN users ON user_from_id = users.id
                WHERE user_to_id = ?`,
                [this.habbo.getId()]
            );

            for (const row of rows) {
                this.friendRequests.add(new FriendRequest({
                    id: row.id,
                    username: row.username,
                    look: row.look
                }));
            }

            this.logger.debug(`Loaded ${this.friendRequests.size} friend requests`);
        } catch (error) {
            this.logger.error('Error loading friend requests:', error);
        }
    }

    /**
     * Send friend request to user
     */
    public static async makeFriendRequest(userFrom: number, userTo: number): Promise<void> {
        try {
            const db = emulator.getDatabase();
            await db.query(
                'INSERT INTO messenger_friendrequests (user_to_id, user_from_id) VALUES (?, ?)',
                [userTo, userFrom]
            );
        } catch (error) {
            const logger = new Logger('Messenger');
            logger.error('Error creating friend request:', error);
        }
    }

    /**
     * Check if friend request already exists
     */
    public static async friendRequestExists(userFrom: number, userTo: number): Promise<boolean> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query(
                'SELECT id FROM messenger_friendrequests WHERE user_to_id = ? AND user_from_id = ? LIMIT 1',
                [userTo, userFrom]
            );
            return rows.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Delete friend requests between two users
     */
    public async deleteFriendRequests(userFrom: number, userTo: number): Promise<number> {
        try {
            const db = emulator.getDatabase();
            const result = await db.query(
                `DELETE FROM messenger_friendrequests
                WHERE (user_to_id = ? AND user_from_id = ?)
                   OR (user_to_id = ? AND user_from_id = ?)`,
                [userTo, userFrom, userFrom, userTo]
            );

            // Remove from local set
            for (const request of this.friendRequests) {
                if (request.getId() === userFrom) {
                    this.friendRequests.delete(request);
                    break;
                }
            }

            return result.affectedRows || 0;
        } catch (error) {
            this.logger.error('Error deleting friend requests:', error);
            return 0;
        }
    }

    /**
     * Delete all friend requests for this user
     */
    public async deleteAllFriendRequests(): Promise<void> {
        try {
            const db = emulator.getDatabase();
            await db.query(
                'DELETE FROM messenger_friendrequests WHERE user_to_id = ?',
                [this.habbo.getId()]
            );
            this.friendRequests.clear();
        } catch (error) {
            this.logger.error('Error deleting all friend requests:', error);
        }
    }

    /**
     * Accept friend request
     */
    public async acceptFriendRequest(userFrom: number, userTo: number): Promise<void> {
        const count = await this.deleteFriendRequests(userFrom, userTo);

        if (count > 0) {
            try {
                const db = emulator.getDatabase();
                const timestamp = Math.floor(Date.now() / 1000);

                // Create friendship both ways
                await db.query(
                    'INSERT INTO messenger_friendships (user_one_id, user_two_id, friends_since) VALUES (?, ?, ?)',
                    [userFrom, userTo, timestamp]
                );
                await db.query(
                    'INSERT INTO messenger_friendships (user_one_id, user_two_id, friends_since) VALUES (?, ?, ?)',
                    [userTo, userFrom, timestamp]
                );

                // Update both habbos if online
                const habboTo = game.getHabboManager()?.getOnlineHabbo(userTo);
                const habboFrom = game.getHabboManager()?.getOnlineHabbo(userFrom);

                if (habboTo && habboFrom) {
                    const buddyTo = MessengerBuddy.fromHabbo(habboFrom, habboTo.getId());
                    const buddyFrom = MessengerBuddy.fromHabbo(habboTo, habboFrom.getId());

                    habboTo.getMessenger()?.addBuddy(buddyTo);
                    habboFrom.getMessenger()?.addBuddy(buddyFrom);

                    // Send update to both clients
                    this.sendFriendUpdate(habboTo, buddyTo, 1);
                    this.sendFriendUpdate(habboFrom, buddyFrom, 1);
                } else if (habboTo) {
                    const buddy = await this.loadFriend(userFrom);
                    if (buddy) {
                        this.sendFriendUpdate(habboTo, buddy, 1);
                    }
                } else if (habboFrom) {
                    const buddy = await habboFrom.getMessenger()?.loadFriend(userTo);
                    if (buddy) {
                        this.sendFriendUpdate(habboFrom, buddy, 1);
                    }
                }

            } catch (error) {
                this.logger.error('Error accepting friend request:', error);
            }
        }
    }

    /**
     * Load a specific friend from database
     */
    public async loadFriend(userId: number): Promise<MessengerBuddy | null> {
        try {
            const db = emulator.getDatabase();
            const rows = await db.query(
                `SELECT
                    users.id,
                    users.username,
                    users.gender,
                    users.online,
                    users.look,
                    users.motto,
                    messenger_friendships.relation,
                    messenger_friendships.category,
                    messenger_friendships.user_one_id
                FROM messenger_friendships
                INNER JOIN users ON messenger_friendships.user_two_id = users.id
                WHERE user_one_id = ? AND user_two_id = ? LIMIT 1`,
                [this.habbo.getId(), userId]
            );

            if (rows.length > 0) {
                const row = rows[0];
                const buddy = new MessengerBuddy({
                    id: row.id,
                    username: row.username,
                    gender: row.gender,
                    online: parseInt(row.online) || 0,
                    look: row.look,
                    motto: row.motto,
                    relation: row.relation || 0,
                    category: row.category || 0,
                    user_one_id: row.user_one_id
                });

                this.friends.set(row.id, buddy);
                return buddy;
            }
        } catch (error) {
            this.logger.error('Error loading friend:', error);
        }
        return null;
    }

    /**
     * Remove friend
     */
    public static async unfriend(userOne: number, userTwo: number): Promise<void> {
        try {
            const db = emulator.getDatabase();
            await db.query(
                `DELETE FROM messenger_friendships
                WHERE (user_one_id = ? AND user_two_id = ?)
                   OR (user_one_id = ? AND user_two_id = ?)`,
                [userOne, userTwo, userTwo, userOne]
            );
        } catch (error) {
            const logger = new Logger('Messenger');
            logger.error('Error removing friend:', error);
        }
    }

    /**
     * Send friend update to client
     */
    private sendFriendUpdate(habbo: Habbo, buddy: MessengerBuddy, action: number): void {
        const client = habbo.getClient();
        if (!client) return;

        const message = new ServerMessage(Outgoing.FriendListUpdateComposer);
        message.appendInt(0); // Categories count

        message.appendInt(1); // Updates count
        message.appendInt(action); // -1 = removed, 0 = updated, 1 = added
        message.appendInt(buddy.getId());

        if (action !== -1) {
            message.appendString(buddy.getUsername());
            message.appendInt(buddy.getGender() === 'M' ? 0 : 1);
            message.appendBoolean(buddy.getOnline() === 1);
            message.appendBoolean(buddy.isInRoom());
            message.appendString(buddy.getLook());
            message.appendInt(buddy.getCategoryId());
            message.appendString(buddy.getMotto());
            message.appendString(''); // Last seen
            message.appendString(''); // Real name
            message.appendBoolean(false); // Offline messaging
            message.appendBoolean(false);
            message.appendBoolean(false);
            message.appendShort(buddy.getRelation());
        }

        client.send(message);
    }

    /**
     * Notify friends about connection status change
     */
    public connectionChanged(online: boolean, inRoom: boolean): void {
        for (const [friendId, buddy] of this.friends) {
            if (buddy.getOnline() === 0) continue;

            const friendHabbo = game.getHabboManager()?.getOnlineHabbo(friendId);
            if (!friendHabbo) continue;

            const friendMessenger = friendHabbo.getMessenger();
            if (!friendMessenger) continue;

            const myBuddy = friendMessenger.getFriend(this.habbo.getId());
            if (!myBuddy) continue;

            myBuddy.setOnline(online);
            myBuddy.setInRoom(inRoom);
            myBuddy.setLook(this.habbo.getLook());
            myBuddy.setGender(this.habbo.getGender());
            myBuddy.setUsername(this.habbo.getUsername());

            this.sendFriendUpdate(friendHabbo, myBuddy, 0);
        }
    }

    /**
     * Send private message to friend
     */
    public sendMessage(toUserId: number, message: string): void {
        const buddy = this.friends.get(toUserId);
        if (!buddy) return;

        const targetHabbo = game.getHabboManager()?.getOnlineHabbo(toUserId);
        if (!targetHabbo) return;

        const client = targetHabbo.getClient();
        if (!client) return;

        const packet = new ServerMessage(Outgoing.NewConsoleMessageComposer);
        packet.appendInt(this.habbo.getId());
        packet.appendString(message);
        packet.appendInt(0); // Seconds ago

        client.send(packet);
    }

    // Getters/Setters
    public getFriends(): Map<number, MessengerBuddy> {
        return this.friends;
    }

    public getFriend(userId: number): MessengerBuddy | undefined {
        return this.friends.get(userId);
    }

    public addBuddy(buddy: MessengerBuddy): void {
        this.friends.set(buddy.getId(), buddy);
    }

    public removeBuddy(userId: number): void {
        this.friends.delete(userId);
    }

    public getFriendRequests(): Set<FriendRequest> {
        return this.friendRequests;
    }

    public findFriendRequest(username: string): FriendRequest | undefined {
        const lowerName = username.toLowerCase();
        for (const request of this.friendRequests) {
            if (request.getUsername().toLowerCase() === lowerName) {
                return request;
            }
        }
        return undefined;
    }

    public dispose(): void {
        this.friends.clear();
        this.friendRequests.clear();
    }
}
