/**
 * SSOTicketEvent
 * Client authenticates with SSO ticket
 * OPTIMIZED: Sends all login packets at once for fast loading
 */

import { MessageHandler } from '../../MessageHandler';
import { ServerMessage } from '../../ServerMessage';
import { Outgoing } from '../../Headers';
import { emulator } from '../../../core/Emulator';
import { Habbo } from '../../../game/users/Habbo';
import { Logger } from '../../../utils/Logger';

export class SSOTicketEvent extends MessageHandler {
    private logger = new Logger('SSOTicketEvent');

    public requiresLogin(): boolean {
        return false;
    }

    public async handle(): Promise<void> {
        const ssoTicket = this.packet.readString();
        const time = this.packet.readInt();

        if (!ssoTicket || ssoTicket.length === 0) {
            this.sendBanned('Invalid SSO ticket');
            return;
        }

        try {
            const db = emulator.getDatabase();

            // Find user by SSO ticket
            const userRow = await db.queryOne<{
                id: number;
                username: string;
                motto: string;
                look: string;
                gender: string;
                credits: number;
                pixels: number;
                points: number;
                rank: number;
                online: string;
                auth_ticket: string;
                ip_current: string;
                account_created: number;
                last_login: number;
            }>(
                'SELECT * FROM users WHERE auth_ticket = ? LIMIT 1',
                [ssoTicket]
            );

            if (!userRow) {
                this.sendBanned('Invalid SSO ticket');
                this.logger.warn(`Invalid SSO ticket attempt from ${this.client.ipAddress}`);
                return;
            }

            // Create Habbo instance
            const habbo = new Habbo(userRow.id, this.client);
            await habbo.load(userRow);
            this.client.setHabbo(habbo);

            // Update user in database (don't await - fire and forget for speed)
            db.execute(
                "UPDATE users SET online = '1', ip_current = ?, last_login = ? WHERE id = ?",
                [this.client.ipAddress, Math.floor(Date.now() / 1000), userRow.id]
            );

            // === SEND ALL LOGIN PACKETS AT ONCE FOR FAST LOADING ===

            // 1. Auth OK
            const authOk = new ServerMessage(Outgoing.AuthenticationOkComposer);
            this.client.send(authOk);

            // 2. User Rights
            const rights = new ServerMessage(Outgoing.UserRightsComposer);
            rights.appendInt(2); // Club level (2=VIP)
            rights.appendInt(userRow.rank);
            rights.appendBoolean(false);
            this.client.send(rights);

            // 3. Availability Status
            const availability = new ServerMessage(Outgoing.AvailabilityStatusComposer);
            availability.appendBoolean(true);
            availability.appendBoolean(false);
            availability.appendBoolean(true);
            this.client.send(availability);

            // 4. User Object (normally from InfoRetrieveEvent)
            const userObject = new ServerMessage(Outgoing.UserObjectComposer);
            userObject.appendInt(habbo.getId());
            userObject.appendString(habbo.getUsername());
            userObject.appendString(habbo.getLook());
            userObject.appendString(habbo.getGender());
            userObject.appendString(habbo.getMotto());
            userObject.appendString(habbo.getUsername());
            userObject.appendBoolean(false);
            userObject.appendInt(0);
            userObject.appendInt(3);
            userObject.appendInt(3);
            userObject.appendBoolean(false);
            userObject.appendString('');
            userObject.appendBoolean(false);
            userObject.appendBoolean(false);
            this.client.send(userObject);

            // 5. User Perks
            const perks = new ServerMessage(Outgoing.UserPerksComposer);
            perks.appendInt(15); // Perk count
            // Add common perks
            perks.appendString('USE_GUIDE_TOOL'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('GIVE_GUIDE_TOURS'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('JUDGE_CHAT_REVIEWS'); perks.appendString('requirement.unfulfilled.helper_level_4'); perks.appendBoolean(false);
            perks.appendString('VOTE_IN_COMPETITIONS'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('CALL_ON_HELPERS'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('CITIZEN'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('TRADE'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('HEIGHTMAP_EDITOR_BETA'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('BUILDER_AT_WORK'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('CALL_ON_HELPERS'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('CAMERA'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('NAVIGATOR_ROOM_THUMBNAIL_CAMERA'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('NAVIGATOR_PHASE_TWO_2014'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('MOUSE_ZOOM'); perks.appendString(''); perks.appendBoolean(true);
            perks.appendString('NAVIGATOR_PHASE_ONE_2014'); perks.appendString(''); perks.appendBoolean(true);
            this.client.send(perks);

            // 6. Builders Club
            const buildersClub = new ServerMessage(Outgoing.BuildersClubMembershipComposer);
            buildersClub.appendInt(2147483647);
            buildersClub.appendInt(100);
            buildersClub.appendInt(100);
            buildersClub.appendInt(0);
            this.client.send(buildersClub);

            // 7. CFH Topics
            const cfh = new ServerMessage(Outgoing.CfhTopicsInitComposer);
            cfh.appendInt(0);
            this.client.send(cfh);

            // 8. Noobness Level
            const noobness = new ServerMessage(Outgoing.NoobnessLevelComposer);
            noobness.appendInt(0);
            this.client.send(noobness);

            // 9. Credits
            const credits = new ServerMessage(Outgoing.CreditBalanceComposer);
            credits.appendString(habbo.getCredits().toString() + '.0');
            this.client.send(credits);

            // 10. Activity Points (duckets etc)
            const activityPoints = new ServerMessage(Outgoing.ActivityPointsComposer);
            activityPoints.appendInt(1); // Currency count
            activityPoints.appendInt(0); // Type (0 = pixels/duckets)
            activityPoints.appendInt(habbo.getPixels());
            this.client.send(activityPoints);

            // 11. Club subscription
            const club = new ServerMessage(Outgoing.HabboClubSubscriptionComposer);
            club.appendString('habbo_club');
            club.appendInt(1); // Days
            club.appendInt(1); // currentPeriodStarted (1 = active)
            club.appendInt(1); // Months
            club.appendInt(1); // Years
            club.appendBoolean(true); // Is VIP
            club.appendBoolean(true); // Is active
            club.appendBoolean(true); // Past due
            club.appendInt(0); // Minutes until expiry
            club.appendInt(0); // Minutes since last modified
            club.appendInt(0);
            club.appendInt(0);
            club.appendInt(0);
            club.appendBoolean(true);
            this.client.send(club);

            // 12. Favourite rooms changed (empty for now)
            const favRooms = new ServerMessage(Outgoing.FavouriteChangedComposer);
            favRooms.appendInt(30); // Max favourite rooms
            favRooms.appendInt(0); // Favourite room count
            this.client.send(favRooms);

            this.logger.info(`User ${habbo.getUsername()} logged in (fast mode)`);

            // Detailed user login log
            this.logger.user('login', {
                userId: habbo.getId(),
                username: habbo.getUsername(),
                ip: this.client.ipAddress
            });

        } catch (error) {
            this.logger.error('Login error:', error);
            this.sendBanned('Login error');
        }
    }

    private sendBanned(reason: string): void {
        const response = new ServerMessage(Outgoing.UserBannedComposer);
        response.appendString(reason);
        this.client.send(response);
        this.client.disconnect(reason);
    }
}
