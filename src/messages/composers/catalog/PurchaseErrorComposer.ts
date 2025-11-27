/**
 * PurchaseErrorComposer - Sends purchase error
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export enum PurchaseError {
    UNKNOWN = 0,
    SOLD_OUT = 1,
    ALREADY_HAVE_BADGE = 2,
    NOT_ENOUGH_CREDITS = 3,
    NOT_ENOUGH_POINTS = 4,
    INVALID_ITEM = 5,
    NO_CLUB = 6,
    CATALOG_PAGE_EXPIRED = 7
}

export class PurchaseErrorComposer {
    private errorCode: PurchaseError;

    constructor(errorCode: PurchaseError) {
        this.errorCode = errorCode;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.PurchaseErrorComposer);
        message.appendInt(this.errorCode);
        return message;
    }
}
