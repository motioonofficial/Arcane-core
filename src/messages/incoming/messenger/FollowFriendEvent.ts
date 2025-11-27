/**
 * FollowFriendEvent - Follow a friend to their room
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { game } from '../../../game/GameEnvironment';

// Error codes for FollowFriendFailedComposer
const FollowError = {
    NOT_IN_FRIEND_LIST: 0,
    FRIEND_OFFLINE: 1,
    FRIEND_NOT_IN_ROOM: 2,
    FRIEND_BLOCKED_STALKING: 3
};

export class FollowFriendEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const friendId = this.packet.readInt();

        const messenger = habbo.getMessenger();
        if (!messenger) return;

        // Check if friend
        const buddy = messenger.getFriend(friendId);
        if (!buddy) {
            this.sendError(FollowError.NOT_IN_FRIEND_LIST);
            return;
        }

        // Get friend habbo
        const friendHabbo = game.getHabboManager()?.getOnlineHabbo(friendId);
        if (!friendHabbo) {
            this.sendError(FollowError.FRIEND_OFFLINE);
            return;
        }

        // Check if friend is in a room
        const room = friendHabbo.getCurrentRoom();
        if (!room) {
            this.sendError(FollowError.FRIEND_NOT_IN_ROOM);
            return;
        }

        // TODO: Check if friend blocks following
        // if (friendHabbo.getHabboStats().blockFollowing) {
        //     this.sendError(FollowError.FRIEND_BLOCKED_STALKING);
        //     return;
        // }

        // Check if already in same room
        if (habbo.getCurrentRoom()?.getId() === room.getId()) {
            // Already in same room - send whisper
            const whisper = new ServerMessage(Outgoing.WhisperComposer);
            const roomUnit = habbo.getRoomUnit();
            whisper.appendInt(roomUnit?.getId() || 0);
            whisper.appendString(`${friendHabbo.getUsername()} zaten bu odada.`);
            whisper.appendInt(0); // Emotion
            whisper.appendInt(34); // Bubble style
            whisper.appendInt(0);
            whisper.appendInt(0);
            this.client.send(whisper);
            return;
        }

        // Forward to friend's room
        const response = new ServerMessage(Outgoing.GetGuestRoomResultComposer);
        response.appendBoolean(false); // Enter room
        response.appendInt(room.getId());
        this.client.send(response);
    }

    private sendError(code: number): void {
        const response = new ServerMessage(Outgoing.FollowFriendFailedComposer);
        response.appendInt(code);
        this.client.send(response);
    }
}
