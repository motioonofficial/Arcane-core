/**
 * GetHeightMapEvent (RequestRoomHeightmapEvent)
 * Client requests the room heightmap - Step 2 of room entry
 *
 * This is called after the client has loaded the room model.
 * We send the heightmap and then complete the room entry.
 *
 * Java equivalent: RequestRoomHeightmapEvent.java
 * Order:
 * 1. RoomRelativeMapComposer (2753) - tile heights as shorts
 * 2. RoomHeightMapComposer (1301) - string heightmap
 * 3. enterRoom() - completes room entry
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';
import { Logger } from '../../../utils/Logger';
import { RoomFloorItemsComposer } from '../../composers/items/RoomFloorItemsComposer';
import { RoomWallItemsComposer } from '../../composers/items/RoomWallItemsComposer';
import type { Room } from '../../../game/rooms/Room';
import type { Habbo } from '../../../game/users/Habbo';

export class GetHeightMapEvent extends MessageHandler {
    private logger = new Logger('GetHeightMapEvent');
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        const loadingRoomId = habbo.getLoadingRoom();
        if (loadingRoomId === 0) return;

        const roomManager = emulator.getGameEnvironment().getRoomManager();
        const room = await roomManager.loadRoom(loadingRoomId);

        if (!room || !room.getLayout()) {
            habbo.setLoadingRoom(0);
            return;
        }

        const layout = room.getLayout()!;

        // === PHASE 1: Send HeightMaps (in Java order) ===

        // 1. RoomRelativeMapComposer (HeightMapComposer - 2753) - tile heights as shorts
        // Java: this.response.appendInt(this.room.getLayout().getMapSize() / this.room.getLayout().getMapSizeY());
        // Java: this.response.appendInt(this.room.getLayout().getMapSize());
        const relativeMap = new ServerMessage(Outgoing.HeightMapComposer);
        const mapSizeX = layout.getMapSizeX();
        const mapSizeY = layout.getMapSizeY();
        const mapSize = mapSizeX * mapSizeY; // Total tiles = width * height

        relativeMap.appendInt(mapSizeX); // Width (Java: mapSize / mapSizeY = mapSizeX)
        relativeMap.appendInt(mapSize); // Total tiles (Java: mapSize which is mapSizeX * mapSizeY)

        // Java loops: for y, for x - same as us
        for (let y = 0; y < mapSizeY; y++) {
            for (let x = 0; x < mapSizeX; x++) {
                const tile = layout.getTile(x, y);
                if (tile) {
                    // Java: this.response.appendShort(t.relativeHeight());
                    relativeMap.appendShort(tile.relativeHeight());
                } else {
                    relativeMap.appendShort(32767); // Short.MAX_VALUE
                }
            }
        }
        this.client.send(relativeMap);

        // 2. RoomHeightMapComposer (FloorHeightMapComposer - 1301) - string heightmap
        // Java: this.response.appendBoolean(true);
        // Java: this.response.appendInt(this.room.getWallHeight());
        // Java: this.response.appendString(this.room.getLayout().getRelativeMap());
        const floorHeightMap = new ServerMessage(Outgoing.FloorHeightMapComposer);
        floorHeightMap.appendBoolean(true); // Fixed floors enabled
        floorHeightMap.appendInt(room.getData().wallHeight); // Fixed wall height (-1 default)
        floorHeightMap.appendString(layout.getRelativeMap());
        this.client.send(floorHeightMap);

        // === PHASE 2: Complete Room Entry ===
        // Java: RoomManager.enterRoom(habbo, room)
        await this.completeRoomEntry(habbo, room);
    }

    private async completeRoomEntry(habbo: Habbo, room: Room): Promise<void> {
        // Add user to room and get their room unit
        const roomUnit = room.addHabbo(habbo);
        habbo.setCurrentRoom(room);
        habbo.setLoadingRoom(0);

        // Log room entry
        this.logger.room('entry', {
            roomId: room.getId(),
            roomName: room.getName(),
            userId: habbo.getId(),
            username: habbo.getUsername(),
            userCount: room.getUserCount()
        });

        // === Java Order (RoomManager.enterRoom) ===

        // === 1. Send RoomPaneComposer (RoomEntryInfoComposer) ===
        const paneComposer = new ServerMessage(Outgoing.RoomEntryInfoComposer);
        paneComposer.appendInt(room.getId());
        paneComposer.appendBoolean(room.isOwner(habbo)); // Is owner
        this.client.send(paneComposer);

        // === 2. Send RoomThicknessComposer (wall/floor thickness) ===
        const thicknessComposer = new ServerMessage(Outgoing.RoomThicknessComposer);
        thicknessComposer.appendBoolean(room.getData().hideWall);
        thicknessComposer.appendInt(room.getData().wallThickness);
        thicknessComposer.appendInt(room.getData().floorThickness);
        this.client.send(thicknessComposer);

        // === 3. Send RoomDataComposer (full room info) ===
        this.sendRoomData(room, habbo);

        // === 4. Send Wall Items FIRST (Java sends wall items before floor items) ===
        this.sendWallItems(room);

        // === 5. Send Floor Items ===
        this.sendFloorItems(room);

        // === 6. Send existing users to the entering user ===
        this.sendExistingUsers(room);
        this.sendUserStatuses(room);

        // === 7. Broadcast new user to all existing users ===
        const allHabbos = room.getHabbos();
        for (const otherHabbo of allHabbos) {
            if (otherHabbo.getId() !== habbo.getId()) {
                // Send new user to existing users
                const newUserPacket = this.createUserPacket(habbo);
                otherHabbo.getClient().send(newUserPacket);

                const newStatusPacket = this.createStatusPacket(habbo);
                otherHabbo.getClient().send(newStatusPacket);
            }
        }
    }

    private createUserPacket(habbo: Habbo): ServerMessage {
        const unit = habbo.getRoomUnit();
        const response = new ServerMessage(Outgoing.RoomUsersComposer);
        response.appendInt(1);
        response.appendInt(habbo.getId());
        response.appendString(habbo.getUsername());
        response.appendString(habbo.getMotto());
        response.appendString(habbo.getLook());
        response.appendInt(unit?.getId() || 0);
        response.appendInt(unit?.getX() || 0);
        response.appendInt(unit?.getY() || 0);
        response.appendString((unit?.getZ() || 0).toString());
        response.appendInt(unit?.getBodyRotation() || 2);
        response.appendInt(1); // User type (1 = habbo)
        response.appendString(habbo.getGender().toUpperCase());
        response.appendInt(-1); // Favorite group ID (-1 = none)
        response.appendInt(-1); // Favorite group status
        response.appendString(''); // Favorite group name
        response.appendString(''); // Figure extra data (swim figure)
        response.appendInt(0); // Achievement score
        response.appendBoolean(true); // Unknown
        return response;
    }

    private createStatusPacket(habbo: Habbo): ServerMessage {
        const unit = habbo.getRoomUnit();
        const response = new ServerMessage(Outgoing.RoomUserStatusComposer);
        response.appendInt(1);
        response.appendInt(unit?.getId() || 0);
        response.appendInt(unit?.getX() || 0);
        response.appendInt(unit?.getY() || 0);
        response.appendString((unit?.getZ() || 0).toString());
        response.appendInt(unit?.getHeadRotation() || 2);
        response.appendInt(unit?.getBodyRotation() || 2);
        response.appendString(unit?.getStatusString() || '');
        return response;
    }

    private sendRoomData(room: Room, habbo: Habbo): void {
        const data = room.getData();
        const response = new ServerMessage(Outgoing.RoomDataComposer);

        // Forward flag (false = just viewing info, true = entering)
        response.appendBoolean(true);

        // Room basic info
        response.appendInt(room.getId());
        response.appendString(room.getName());
        response.appendInt(room.isPublicRoom() ? 0 : room.getOwnerId());
        response.appendString(room.isPublicRoom() ? '' : room.getOwnerName());
        response.appendInt(room.getState()); // 0=open, 1=doorbell, 2=password, 3=invisible
        response.appendInt(room.getUserCount());
        response.appendInt(room.getUsersMax());
        response.appendString(room.getDescription());
        response.appendInt(data.tradeSettings); // Trade mode
        response.appendInt(room.getScore());
        response.appendInt(0); // Ranking
        response.appendInt(room.getCategoryId());

        // Tags
        const tags = data.tags ? data.tags.split(';').filter(t => t.length > 0) : [];
        response.appendInt(tags.length);
        for (const tag of tags) {
            response.appendString(tag);
        }

        // Flags (bitfield)
        let flags = 0;
        if (room.getGuildId() > 0) flags |= 2;
        // if (room.isPromoted()) flags |= 4;
        if (!room.isPublicRoom()) flags |= 8;
        if (data.allowPets) flags |= 16;
        response.appendInt(flags);

        // Guild info (if has guild)
        if (room.getGuildId() > 0) {
            response.appendInt(room.getGuildId());
            response.appendString(''); // Guild name - TODO: load from guild manager
            response.appendString(''); // Guild badge
        }

        // Promotion info (if promoted - we skip this for now)
        // if (room.isPromoted()) {
        //     response.appendString(promotion.title);
        //     response.appendString(promotion.description);
        //     response.appendInt(minutesSinceStart);
        //     response.appendInt(minutesUntilEnd);
        // }

        // Additional flags
        response.appendBoolean(true); // Room forward enabled
        response.appendBoolean(false); // Staff picked
        response.appendBoolean(false); // Is group member
        response.appendBoolean(false); // All muted

        // Moderation settings
        response.appendInt(data.muteSettings);
        response.appendInt(data.kickSettings);
        response.appendInt(data.banSettings);

        // Rights
        response.appendBoolean(room.hasRights(habbo)); // Can mute

        // Chat settings
        response.appendInt(data.chatMode);
        response.appendInt(data.chatWeight);
        response.appendInt(data.chatSpeed);
        response.appendInt(data.chatHearingDistance);
        response.appendInt(data.chatProtection);

        this.client.send(response);
    }

    private sendFloorItems(room: Room): void {
        const itemManager = room.getItemManager();
        const floorItems = itemManager?.getFloorItems() || [];

        if (floorItems.length === 0) {
            // Send empty floor items with room owner
            const response = new ServerMessage(Outgoing.RoomFloorItemsComposer);
            response.appendInt(1);
            response.appendInt(room.getOwnerId());
            response.appendString(room.getOwnerName());
            response.appendInt(0);
            this.client.send(response);
            return;
        }

        this.client.send(new RoomFloorItemsComposer(floorItems).compose());
    }

    private sendWallItems(room: Room): void {
        const itemManager = room.getItemManager();
        const wallItems = itemManager?.getWallItems() || [];

        if (wallItems.length === 0) {
            // Send empty wall items with room owner
            const response = new ServerMessage(Outgoing.RoomWallItemsComposer);
            response.appendInt(1);
            response.appendInt(room.getOwnerId());
            response.appendString(room.getOwnerName());
            response.appendInt(0);
            this.client.send(response);
            return;
        }

        this.client.send(new RoomWallItemsComposer(wallItems).compose());
    }

    private sendExistingUsers(room: Room): void {
        const users = room.getHabbos();
        if (users.length === 0) return;

        const response = new ServerMessage(Outgoing.RoomUsersComposer);
        response.appendInt(users.length);

        for (const user of users) {
            const unit = user.getRoomUnit();

            response.appendInt(user.getId());
            response.appendString(user.getUsername());
            response.appendString(user.getMotto());
            response.appendString(user.getLook());
            response.appendInt(unit?.getId() || 0);
            response.appendInt(unit?.getX() || 0);
            response.appendInt(unit?.getY() || 0);
            response.appendString((unit?.getZ() || 0).toString());
            response.appendInt(unit?.getBodyRotation() || 2);
            response.appendInt(1); // User type (1 = habbo)
            response.appendString(user.getGender().toUpperCase());
            response.appendInt(-1); // Favorite group ID (-1 = none)
            response.appendInt(-1); // Favorite group status
            response.appendString(''); // Favorite group name
            response.appendString(''); // Figure extra data (swim figure)
            response.appendInt(0); // Achievement score
            response.appendBoolean(true); // Unknown
        }

        this.client.send(response);
    }

    private sendUserStatuses(room: Room): void {
        const users = room.getHabbos();
        if (users.length === 0) return;

        const response = new ServerMessage(Outgoing.RoomUserStatusComposer);
        response.appendInt(users.length);

        for (const user of users) {
            const unit = user.getRoomUnit();
            if (!unit) continue;

            response.appendInt(unit.getId());
            response.appendInt(unit.getX());
            response.appendInt(unit.getY());
            response.appendString(unit.getZ().toString());
            response.appendInt(unit.getHeadRotation());
            response.appendInt(unit.getBodyRotation());
            response.appendString(unit.getStatusString());
        }

        this.client.send(response);
    }
}
