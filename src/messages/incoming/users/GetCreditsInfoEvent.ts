/**
 * GetCreditsInfoEvent - Client requests user's credit balance
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetCreditsInfoEvent extends MessageHandler {
    public async handle(): Promise<void> {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send credits balance
        const credits = new ServerMessage(Outgoing.CreditBalanceComposer);
        credits.appendString(habbo.getCredits().toString());
        this.client.send(credits);

        // Send activity points (duckets, diamonds, etc.)
        const points = new ServerMessage(Outgoing.ActivityPointsComposer);
        points.appendInt(1); // Number of point types

        // Duckets (type 0)
        points.appendInt(0);
        points.appendInt(habbo.getPixels());

        this.client.send(points);
    }
}
