/**
 * RequestNewNavigatorDataEvent
 * Client requests initial navigator data when opening navigator
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class RequestNewNavigatorDataEvent extends MessageHandler {
    public handle(): void {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // 1. Navigator Settings (window position/size)
        const settings = new ServerMessage(Outgoing.NavigatorSettingsComposer);
        settings.appendInt(100);  // x
        settings.appendInt(100);  // y
        settings.appendInt(425);  // width
        settings.appendInt(535);  // height
        settings.appendBoolean(false); // open searches
        settings.appendInt(0);    // results mode
        this.client.send(settings);

        // 2. Navigator Metadata (view types)
        const metadata = new ServerMessage(Outgoing.NavigatorMetaDataComposer);
        metadata.appendInt(4); // view count

        // official_view
        metadata.appendString('official_view');
        metadata.appendInt(0); // saved searches count

        // hotel_view
        metadata.appendString('hotel_view');
        metadata.appendInt(0);

        // roomads_view
        metadata.appendString('roomads_view');
        metadata.appendInt(0);

        // myworld_view
        metadata.appendString('myworld_view');
        metadata.appendInt(0);

        this.client.send(metadata);

        // 3. Lifted Rooms (promoted rooms)
        const lifted = new ServerMessage(Outgoing.NavigatorLiftedRoomsComposer);
        lifted.appendInt(0); // count
        this.client.send(lifted);

        // 4. Collapsed Categories
        const collapsed = new ServerMessage(Outgoing.NavigatorCollapsedCategoriesComposer);
        collapsed.appendInt(0); // count
        this.client.send(collapsed);

        // 5. Saved Searches
        const saved = new ServerMessage(Outgoing.NavigatorSavedSearchesComposer);
        saved.appendInt(0); // count
        this.client.send(saved);

        // 6. Event Categories
        const events = new ServerMessage(Outgoing.NavigatorEventCategoriesComposer);
        events.appendInt(0); // count
        this.client.send(events);
    }
}
