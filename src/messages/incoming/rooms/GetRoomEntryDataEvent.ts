/**
 * GetRoomEntryDataEvent
 * Client requests room entry data (alternative entry point)
 */

import { MessageHandler } from '../../MessageHandler';

export class GetRoomEntryDataEvent extends MessageHandler {
    public async handle(): Promise<void> {
        // This event is typically handled by GetHeightMapEvent
        // Some clients send this instead or in addition
        // For now, we can ignore it as GetHeightMapEvent handles the entry
    }
}
