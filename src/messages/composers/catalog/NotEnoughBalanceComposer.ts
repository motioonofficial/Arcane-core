/**
 * NotEnoughBalanceComposer - Insufficient funds notification
 */

import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class NotEnoughBalanceComposer {
    private needsCredits: boolean;
    private needsPoints: boolean;
    private pointsType: number;

    constructor(needsCredits: boolean, needsPoints: boolean, pointsType: number = 0) {
        this.needsCredits = needsCredits;
        this.needsPoints = needsPoints;
        this.pointsType = pointsType;
    }

    public compose(): ServerMessage {
        const message = new ServerMessage(Outgoing.NotEnoughBalanceComposer);
        message.appendBoolean(this.needsCredits);
        message.appendBoolean(this.needsPoints);
        message.appendInt(this.pointsType);
        return message;
    }
}
