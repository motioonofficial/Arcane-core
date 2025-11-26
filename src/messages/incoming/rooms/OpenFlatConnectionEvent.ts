/**
 * OpenFlatConnectionEvent (RequestRoomLoadEvent)
 * Client requests to enter a room - Step 1 of room entry
 *
 * Flow:
 * 1. Client sends OpenFlatConnectionEvent with roomId and password
 * 2. Server validates access and sends RoomOpen, RoomModel, RoomPaint, etc.
 * 3. Client loads the model and sends GetHeightMapEvent
 * 4. Server sends heightmap and completes room entry
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';
import { RoomState } from '../../../game/rooms/Room';

export class OpenFlatConnectionEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const roomId = this.packet.readInt();
        const password = this.packet.readString();

        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Prevent spam - must wait 1 second between room entries
        // if (habbo.getLoadingRoom() !== 0) {
        //     return;
        // }

        // Leave current room if in one
        const currentRoom = habbo.getCurrentRoom();
        if (currentRoom) {
            // Notify other users that this user left
            this.broadcastUserRemove(currentRoom, habbo);
            currentRoom.removeHabbo(habbo);
        }

        const roomManager = emulator.getGameEnvironment().getRoomManager();
        const room = await roomManager.loadRoom(roomId);

        if (!room) {
            // Room not found - send to hotel view
            this.sendHotelView();
            return;
        }

        if (!room.getLayout()) {
            // No layout - send to hotel view
            this.sendHotelView();
            return;
        }

        // Check room access
        const canEnter = this.checkAccess(habbo, room, password);
        if (!canEnter) {
            this.sendHotelView();
            return;
        }

        // Set loading room
        habbo.setLoadingRoom(roomId);

        // === PHASE 1: Send RoomOpen (empty packet signals room is opening) ===
        const openResponse = new ServerMessage(Outgoing.RoomOpenComposer);
        this.client.send(openResponse);

        // === PHASE 2: Send RoomModel (tells client which model to load) ===
        const modelResponse = new ServerMessage(Outgoing.RoomReadyComposer);
        modelResponse.appendString(room.getLayout()!.getName());
        modelResponse.appendInt(roomId);
        this.client.send(modelResponse);

        // === PHASE 3: Send room decorations ===
        // Wallpaper
        if (room.getWallPaint() !== '0.0') {
            const wallPaint = new ServerMessage(Outgoing.RoomPaintComposer);
            wallPaint.appendString('wallpaper');
            wallPaint.appendString(room.getWallPaint());
            this.client.send(wallPaint);
        }

        // Floor
        if (room.getFloorPaint() !== '0.0') {
            const floorPaint = new ServerMessage(Outgoing.RoomPaintComposer);
            floorPaint.appendString('floor');
            floorPaint.appendString(room.getFloorPaint());
            this.client.send(floorPaint);
        }

        // Landscape (always send)
        const landscapePaint = new ServerMessage(Outgoing.RoomPaintComposer);
        landscapePaint.appendString('landscape');
        landscapePaint.appendString(room.getLandscapePaint());
        this.client.send(landscapePaint);

        // === PHASE 4: Send room rights ===
        // 0 = no rights, 1 = has rights, 4 = owner
        const rightsLevel = room.isOwner(habbo) ? 4 : (room.hasRights(habbo) ? 1 : 0);
        const rightsResponse = new ServerMessage(Outgoing.RoomRightsComposer);
        rightsResponse.appendInt(rightsLevel);
        this.client.send(rightsResponse);

        // === PHASE 5: Send room score ===
        const scoreResponse = new ServerMessage(Outgoing.RoomScoreComposer);
        scoreResponse.appendInt(room.getScore());
        scoreResponse.appendBoolean(true); // Can vote
        this.client.send(scoreResponse);

        // Now we wait for GetHeightMapEvent from client
    }

    private checkAccess(habbo: any, room: any, password: string): boolean {
        // Owner or has rights can always enter
        if (room.isOwner(habbo) || room.hasRights(habbo)) {
            return true;
        }

        // Staff can enter any room
        if (habbo.hasPermission('acc_enteranyroom')) {
            return true;
        }

        // Check room state
        switch (room.getState()) {
            case RoomState.OPEN:
                return true;

            case RoomState.DOORBELL:
                // TODO: Implement doorbell queue system
                // For now, allow entry
                return true;

            case RoomState.PASSWORD:
                if (room.getPassword() === password) {
                    return true;
                }
                // Wrong password
                const errorResponse = new ServerMessage(Outgoing.GenericErrorComposer);
                errorResponse.appendInt(-100002); // Wrong password error
                this.client.send(errorResponse);
                return false;

            case RoomState.INVISIBLE:
                // Only owner/rights can enter invisible rooms
                return false;

            default:
                return true;
        }
    }

    private sendHotelView(): void {
        // Send close connection (sends user back to hotel view)
        const response = new ServerMessage(Outgoing.CloseConnectionComposer);
        this.client.send(response);
    }

    private broadcastUserRemove(room: any, habbo: any): void {
        const roomUnit = habbo.getRoomUnit();
        if (!roomUnit) return;

        // RoomUserRemoveComposer - tells other users this user left
        const removePacket = new ServerMessage(Outgoing.RoomUserRemoveComposer);
        removePacket.appendString(roomUnit.getId().toString());

        for (const user of room.getHabbos()) {
            if (user.getId() !== habbo.getId()) {
                user.getClient().send(removePacket);
            }
        }
    }
}
