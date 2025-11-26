/**
 * RequestNavigatorSettingsEvent
 * Client requests navigator window settings
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class RequestNavigatorSettingsEvent extends MessageHandler {
    public handle(): void {
        const response = new ServerMessage(Outgoing.NavigatorSettingsComposer);
        response.appendInt(100);  // x
        response.appendInt(100);  // y
        response.appendInt(425);  // width
        response.appendInt(535);  // height
        response.appendBoolean(false); // open searches
        response.appendInt(0);    // results mode

        this.client.send(response);
    }
}
