/**
 * PacketManager - Handles packet registration and dispatching
 * Maps incoming packet headers to their handlers
 */

import { Logger } from '../utils/Logger';
import { config } from '../config/Configuration';
import type { GameClient } from '../network/GameClient';
import type { WebSocketClient } from '../network/WebSocketClient';
import type { ClientMessage } from './ClientMessage';
import type { MessageHandler } from './MessageHandler';

// Import handlers - Handshake
import { ReleaseVersionEvent } from './incoming/handshake/ReleaseVersionEvent';
import { InitDiffieHandshakeEvent } from './incoming/handshake/InitDiffieHandshakeEvent';
import { CompleteDiffieHandshakeEvent } from './incoming/handshake/CompleteDiffieHandshakeEvent';
import { UniqueIdEvent } from './incoming/handshake/UniqueIdEvent';
import { SSOTicketEvent } from './incoming/handshake/SSOTicketEvent';
import { ClientVariablesEvent } from './incoming/handshake/ClientVariablesEvent';
import { PongEvent } from './incoming/handshake/PongEvent';
import { LatencyPingRequestEvent } from './incoming/handshake/LatencyPingRequestEvent';

// Import handlers - Users
import { InfoRetrieveEvent } from './incoming/users/InfoRetrieveEvent';

// Import handlers - Navigator
import { RequestNewNavigatorDataEvent } from './incoming/navigator/RequestNewNavigatorDataEvent';
import { RequestNewNavigatorRoomsEvent } from './incoming/navigator/RequestNewNavigatorRoomsEvent';
import { RequestNavigatorSettingsEvent } from './incoming/navigator/RequestNavigatorSettingsEvent';

// Import handlers - Rooms
import { GetGuestRoomEvent } from './incoming/rooms/GetGuestRoomEvent';
import { OpenFlatConnectionEvent } from './incoming/rooms/OpenFlatConnectionEvent';
import { GetHeightMapEvent } from './incoming/rooms/GetHeightMapEvent';

// Import handlers - Room Users
import { RoomUserWalkEvent } from './incoming/rooms/users/RoomUserWalkEvent';

// Import handlers - Room Chat
import { RoomUserTalkEvent } from './incoming/rooms/chat/RoomUserTalkEvent';
import { RoomUserShoutEvent } from './incoming/rooms/chat/RoomUserShoutEvent';
import { RoomUserWhisperEvent } from './incoming/rooms/chat/RoomUserWhisperEvent';
import { RoomUserStartTypingEvent } from './incoming/rooms/chat/RoomUserStartTypingEvent';
import { RoomUserStopTypingEvent } from './incoming/rooms/chat/RoomUserStopTypingEvent';

// Import handlers - Room Items
import { PlaceObjectEvent } from './incoming/rooms/items/PlaceObjectEvent';
import { MoveObjectEvent } from './incoming/rooms/items/MoveObjectEvent';
import { MoveWallItemEvent } from './incoming/rooms/items/MoveWallItemEvent';
import { PickupObjectEvent } from './incoming/rooms/items/PickupObjectEvent';
import { UseFurnitureEvent } from './incoming/rooms/items/UseFurnitureEvent';
import { UseWallItemEvent } from './incoming/rooms/items/UseWallItemEvent';

// Import handlers - Floor Plan Editor
import { FloorPlanEditorRequestDoorSettingsEvent } from './incoming/floorplaneditor/FloorPlanEditorRequestDoorSettingsEvent';
import { FloorPlanEditorRequestBlockedTilesEvent } from './incoming/floorplaneditor/FloorPlanEditorRequestBlockedTilesEvent';
import { FloorPlanEditorSaveEvent } from './incoming/floorplaneditor/FloorPlanEditorSaveEvent';

// Import handlers - Inventory
import { GetInventoryEvent } from './incoming/users/GetInventoryEvent';

import { Incoming } from './Headers';

type AnyClient = GameClient | WebSocketClient;

type HandlerConstructor = new () => MessageHandler;

export class PacketManager {
    private logger = new Logger('PacketManager');
    private handlers: Map<number, HandlerConstructor> = new Map();
    private rateLimits: Map<number, Map<number, number>> = new Map(); // clientId -> header -> lastTime

    public async initialize(): Promise<void> {
        this.registerHandlers();
        this.logger.info(`Registered ${this.handlers.size} packet handlers`);
    }

    private registerHandlers(): void {
        // Handshake
        this.register(Incoming.ReleaseVersionEvent, ReleaseVersionEvent);
        this.register(Incoming.InitDiffieHandshake, InitDiffieHandshakeEvent);
        this.register(Incoming.CompleteDiffieHandshake, CompleteDiffieHandshakeEvent);
        this.register(Incoming.UniqueIdEvent, UniqueIdEvent);
        this.register(Incoming.SSOTicketEvent, SSOTicketEvent);
        this.register(Incoming.ClientVariablesEvent, ClientVariablesEvent);
        this.register(Incoming.PongEvent, PongEvent);
        this.register(Incoming.LatencyPingRequestEvent, LatencyPingRequestEvent);

        // Users
        this.register(Incoming.InfoRetrieveEvent, InfoRetrieveEvent);

        // Navigator
        this.register(Incoming.RequestNewNavigatorDataEvent, RequestNewNavigatorDataEvent);
        this.register(Incoming.RequestNewNavigatorRoomsEvent, RequestNewNavigatorRoomsEvent);
        this.register(Incoming.RequestNavigatorSettingsEvent, RequestNavigatorSettingsEvent);

        // Rooms
        this.register(Incoming.GetGuestRoomEvent, GetGuestRoomEvent);
        this.register(Incoming.OpenFlatConnectionEvent, OpenFlatConnectionEvent);
        this.register(Incoming.GetHeightMapEvent, GetHeightMapEvent);

        // Room Users
        this.register(Incoming.RoomUserWalkEvent, RoomUserWalkEvent);

        // Room Chat
        this.register(Incoming.ChatEvent, RoomUserTalkEvent);
        this.register(Incoming.ShoutEvent, RoomUserShoutEvent);
        this.register(Incoming.WhisperEvent, RoomUserWhisperEvent);
        this.register(Incoming.StartTypingEvent, RoomUserStartTypingEvent);
        this.register(Incoming.CancelTypingEvent, RoomUserStopTypingEvent);

        // Room Items
        this.register(Incoming.PlaceObjectEvent, PlaceObjectEvent);
        this.register(Incoming.MoveObjectEvent, MoveObjectEvent);
        this.register(Incoming.MoveWallItemEvent, MoveWallItemEvent);
        this.register(Incoming.PickupObjectEvent, PickupObjectEvent);
        this.register(Incoming.UseFurnitureEvent, UseFurnitureEvent);
        this.register(Incoming.UseWallItemEvent, UseWallItemEvent);

        // Inventory
        this.register(Incoming.GetInventoryEvent, GetInventoryEvent);

        // Floor Plan Editor
        this.register(Incoming.FloorPlanEditorRequestDoorSettingsEvent, FloorPlanEditorRequestDoorSettingsEvent);
        this.register(Incoming.FloorPlanEditorRequestBlockedTilesEvent, FloorPlanEditorRequestBlockedTilesEvent);
        this.register(Incoming.FloorPlanEditorSaveEvent, FloorPlanEditorSaveEvent);
    }

    private register(header: number, handler: HandlerConstructor): void {
        if (this.handlers.has(header)) {
            this.logger.warn(`Handler for header ${header} already registered, overwriting`);
        }
        this.handlers.set(header, handler);
    }

    public async handlePacket(client: AnyClient, packet: ClientMessage): Promise<void> {
        const header = packet.getHeader();
        const HandlerClass = this.handlers.get(header);

        // Log incoming packet
        this.logger.packet('IN', header);

        if (!HandlerClass) {
            if (config.log.logPackets) {
                this.logger.debug(`Unhandled packet: ${header}`);
            }
            return;
        }

        try {
            // Create handler instance
            const handler = new HandlerClass();

            // Check if login is required
            if (handler.requiresLogin() && !client.isLoggedIn()) {
                this.logger.debug(`Client ${client.id} tried to use handler ${header} without login`);
                return;
            }

            // Check rate limit
            const rateLimit = handler.getRateLimit();
            if (rateLimit > 0) {
                if (!this.checkRateLimit(client.id, header, rateLimit)) {
                    this.logger.debug(`Client ${client.id} rate limited for header ${header}`);
                    return;
                }
            }

            // Initialize and execute handler
            handler.init(client, packet);
            await handler.handle();

        } catch (error) {
            this.logger.error(`Error handling packet ${header}:`, error);
        }
    }

    private checkRateLimit(clientId: number, header: number, limitMs: number): boolean {
        const now = Date.now();

        let clientLimits = this.rateLimits.get(clientId);
        if (!clientLimits) {
            clientLimits = new Map();
            this.rateLimits.set(clientId, clientLimits);
        }

        const lastTime = clientLimits.get(header) || 0;
        if (now - lastTime < limitMs) {
            return false;
        }

        clientLimits.set(header, now);
        return true;
    }

    public clearClientRateLimits(clientId: number): void {
        this.rateLimits.delete(clientId);
    }

    public getHandlerCount(): number {
        return this.handlers.size;
    }

    public hasHandler(header: number): boolean {
        return this.handlers.has(header);
    }
}
