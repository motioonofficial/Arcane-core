/**
 * RequestNewNavigatorRoomsEvent
 * Client requests room list for a specific view/category
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';
import type { Room } from '../../../game/rooms/Room';
import type { RoomManager } from '../../../game/rooms/RoomManager';

export class RequestNewNavigatorRoomsEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        let view = this.packet.readString();
        const query = this.packet.readString();

        // Handle query and groups redirects
        if (view === 'query' || view === 'groups') {
            view = 'hotel_view';
        }

        const gameEnv = emulator.getGameEnvironment();
        const roomManager = gameEnv.getRoomManager();

        const response = new ServerMessage(Outgoing.NewNavigatorSearchResultsComposer);
        response.appendString(view);
        response.appendString(query);

        // Handle different views
        switch (view) {
            case 'official_view':
                await this.handleOfficialView(response, roomManager);
                break;

            case 'hotel_view':
                await this.handleHotelView(response, query, roomManager);
                break;

            case 'myworld_view':
                await this.handleMyWorldView(response, habbo.getId(), roomManager);
                break;

            case 'roomads_view':
                await this.handleRoomAdsView(response);
                break;

            default:
                // Handle specific searches or category views
                if (query.length > 0) {
                    await this.handleSearch(response, view, query, roomManager);
                } else {
                    // Try as category
                    await this.handleCategoryView(response, view, roomManager);
                }
        }

        this.client.send(response);
    }

    private async handleOfficialView(message: ServerMessage, roomManager: RoomManager): Promise<void> {
        const publicRooms = roomManager.getPublicRooms();

        // One category for official/public rooms
        message.appendInt(1); // result count

        this.serializeSearchResult(message, 'official-root', '', publicRooms, false, false, 1); // 1 = thumbnails
    }

    private async handleHotelView(message: ServerMessage, query: string, roomManager: RoomManager): Promise<void> {
        if (query.length > 0) {
            // Search
            const rooms = await roomManager.searchRooms(query);
            message.appendInt(1);
            this.serializeSearchResult(message, 'query', query, rooms, false, false, 0);
        } else {
            // Popular rooms - all active rooms sorted by users
            const popularRooms = await roomManager.getAllRooms(50);

            message.appendInt(1);
            this.serializeSearchResult(message, 'popular', '', popularRooms, true, false, 0);
        }
    }

    private async handleMyWorldView(message: ServerMessage, userId: number, roomManager: RoomManager): Promise<void> {
        const myRooms = await roomManager.getRoomsByOwner(userId);
        const favoriteRooms: Room[] = []; // TODO: Implement favorites
        const visitedRooms: Room[] = []; // TODO: Implement room history

        // Count non-empty categories
        let categoryCount = 1; // Always show "my" even if empty
        if (favoriteRooms.length > 0) categoryCount++;
        if (visitedRooms.length > 0) categoryCount++;

        message.appendInt(categoryCount);

        // My rooms
        this.serializeSearchResult(message, 'my', '', myRooms, false, false, 0);

        // Favorites
        if (favoriteRooms.length > 0) {
            this.serializeSearchResult(message, 'favorites', '', favoriteRooms, false, false, 0);
        }

        // Room history
        if (visitedRooms.length > 0) {
            this.serializeSearchResult(message, 'history', '', visitedRooms, false, false, 0);
        }
    }

    private async handleRoomAdsView(message: ServerMessage): Promise<void> {
        message.appendInt(0); // No room ads
    }

    private async handleCategoryView(message: ServerMessage, view: string, roomManager: RoomManager): Promise<void> {
        // Try to get rooms for a specific category
        const navigatorManager = emulator.getGameEnvironment().getNavigatorManager();
        const categories = navigatorManager.getCategories();

        // Find category by caption_save
        const category = categories.find(c => c.caption.toLowerCase() === view.toLowerCase());

        if (category) {
            const rooms = await roomManager.getRoomsByCategory(category.id, 50);
            message.appendInt(1);
            this.serializeSearchResult(message, view, '', rooms, true, false, 0);
        } else {
            // No category found, return empty
            message.appendInt(1);
            this.serializeSearchResult(message, view, '', [], false, false, 0);
        }
    }

    private async handleSearch(message: ServerMessage, view: string, query: string, roomManager: RoomManager): Promise<void> {
        // Handle search filters like owner:name, tag:tag, etc.
        let searchQuery = query;
        let searchType = 'anything';

        if (query.includes(':')) {
            const parts = query.split(':');
            if (parts.length >= 2) {
                searchType = parts[0].toLowerCase();
                searchQuery = parts.slice(1).join(':');
            }
        }

        const rooms = await roomManager.searchRooms(searchQuery);

        message.appendInt(1);
        this.serializeSearchResult(message, 'query', query, rooms, false, false, 0);
    }

    private serializeSearchResult(
        message: ServerMessage,
        code: string,
        query: string,
        rooms: Room[],
        showMore: boolean,
        collapsed: boolean,
        viewMode: number = 0
    ): void {
        message.appendString(code);      // search code
        message.appendString(query);     // query text
        message.appendInt(showMore ? 1 : 0);  // action (0=none, 1=more, 2=back)
        message.appendBoolean(collapsed); // collapsed
        message.appendInt(viewMode);     // view mode (0=list, 1=thumbnails, 2=thumbnails no choice)

        // Rooms
        message.appendInt(rooms.length);
        for (const room of rooms) {
            room.serialize(message);
        }
    }
}
