/**
 * InfoRetrieveEvent
 * Client requests user information
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';

export class InfoRetrieveEvent extends MessageHandler {
    public handle(): void {
        const habbo = this.client.getHabbo();
        if (!habbo) return;

        // Send user object
        const userObject = new ServerMessage(Outgoing.UserObjectComposer);
        userObject.appendInt(habbo.getId());
        userObject.appendString(habbo.getUsername());
        userObject.appendString(habbo.getLook());
        userObject.appendString(habbo.getGender());
        userObject.appendString(habbo.getMotto());
        userObject.appendString(habbo.getUsername()); // Real name
        userObject.appendBoolean(false); // Direct mail
        userObject.appendInt(0); // Respect points
        userObject.appendInt(0); // Daily respect points
        userObject.appendInt(0); // Daily pet respect points
        userObject.appendBoolean(false); // Friend stream enabled
        userObject.appendString(''); // Last access date
        userObject.appendBoolean(false); // Can change name
        userObject.appendBoolean(false); // Safety locked

        this.client.send(userObject);

        // Send perks
        const perks = new ServerMessage(Outgoing.UserPerksComposer);
        perks.appendInt(0); // Perk count
        this.client.send(perks);

        // Send builders club
        const buildersClub = new ServerMessage(Outgoing.BuildersClubMembershipComposer);
        buildersClub.appendInt(0); // Seconds left
        buildersClub.appendInt(0); // Furni limit
        buildersClub.appendInt(100); // Max furni limit
        buildersClub.appendInt(0); // Seconds left until activation
        this.client.send(buildersClub);

        // Send CFH topics
        const cfh = new ServerMessage(Outgoing.CfhTopicsInitComposer);
        cfh.appendInt(0); // Topic count
        this.client.send(cfh);

        // Send noobness level (for tutorial)
        const noobness = new ServerMessage(Outgoing.NoobnessLevelComposer);
        noobness.appendInt(0); // Level (0 = no tutorial)
        this.client.send(noobness);
    }
}
