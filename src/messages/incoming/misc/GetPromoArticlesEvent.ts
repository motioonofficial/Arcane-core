/**
 * GetPromoArticlesEvent - Get promotional articles (CMS content)
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class GetPromoArticlesEvent extends MessageHandler {
    public async handle(): Promise<void> {
        // Send empty promo articles
        const response = new ServerMessage(Outgoing.PromoArticlesComposer);
        response.appendInt(0); // Articles count

        this.client.send(response);
    }
}
