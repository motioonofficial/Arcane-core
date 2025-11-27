/**
 * RoomUnit - Represents an entity in a room (user, bot, pet)
 */

import type { Room } from './Room';
import type { RoomTile } from './RoomLayout';
import { Pathfinder } from './Pathfinder';

export enum RoomUnitType {
    USER = 1,
    BOT = 4,
    PET = 2
}

export enum RoomUserRotation {
    NORTH = 0,
    NORTH_EAST = 1,
    EAST = 2,
    SOUTH_EAST = 3,
    SOUTH = 4,
    SOUTH_WEST = 5,
    WEST = 6,
    NORTH_WEST = 7
}

export enum RoomUnitStatus {
    MOVE = 'mv',
    SIT = 'sit',
    LAY = 'lay',
    FLAT_CONTROL = 'flatctrl',
    SIGN = 'sign',
    GESTURE = 'gst',
    WAVE = 'wav',
    TRADING = 'trd',
    DIP = 'dip',
    EAT = 'eat',
    BEG = 'beg',
    DEAD = 'ded',
    JUMP = 'jmp',
    PLAY = 'pla',
    SPEAK = 'spk',
    CROAK = 'crk',
    RELAX = 'rlx',
    WINGS = 'wng',
    FLAME = 'flm',
    RIP = 'rip',
    GROW = 'grw',
    GROW_1 = 'grw1',
    GROW_2 = 'grw2',
    GROW_3 = 'grw3',
    GROW_4 = 'grw4',
    GROW_5 = 'grw5',
    GROW_6 = 'grw6',
    GROW_7 = 'grw7',
}

export class RoomUnit {
    private id: number = 0;
    private room: Room | null = null;
    private x: number = 0;
    private y: number = 0;
    private z: number = 0;
    private previousX: number = 0;
    private previousY: number = 0;
    private previousZ: number = 0;
    private headRotation: RoomUserRotation = RoomUserRotation.SOUTH;
    private bodyRotation: RoomUserRotation = RoomUserRotation.SOUTH;
    private unitType: RoomUnitType = RoomUnitType.USER;
    private inRoom: boolean = false;
    private canWalk: boolean = true;

    private statuses: Map<string, string> = new Map();

    // Movement
    private walking: boolean = false;
    private goalX: number = -1;
    private goalY: number = -1;
    private path: RoomTile[] = [];
    private pathIndex: number = 0;
    private needsUpdate: boolean = false;
    private teleporting: boolean = false;
    private sitUpdate: boolean = false; // Java: flag to check sit on NEXT tick after stopping

    // Idle & Look
    private idleTimer: number = 0;
    private lookingAtUser: boolean = false;
    private lookTargetX: number = -1;
    private lookTargetY: number = -1;
    private lastHeadLookTime: number = 0;
    private headLookDuration: number = 0;
    private headLockFromUser: boolean = false; // true if locked from looking at user
    private originalHeadRotation: RoomUserRotation = RoomUserRotation.SOUTH;

    // AFK Mode
    private afk: boolean = false;
    private afkStartTime: number = 0;
    private originalMotto: string = '';

    // Effect
    private effectId: number = 0;
    private effectEndTimestamp: number = 0;

    // Dance
    private danceType: number = 0;

    constructor() {}

    public isTeleporting(): boolean {
        return this.teleporting;
    }

    public setTeleporting(value: boolean): void {
        this.teleporting = value;
    }

    public getId(): number {
        return this.id;
    }

    public setId(id: number): void {
        this.id = id;
    }

    public getRoom(): Room | null {
        return this.room;
    }

    public setRoom(room: Room | null): void {
        this.room = room;
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getZ(): number {
        return this.z;
    }

    /**
     * Set location from tile (for initial placement)
     * Sets both current and previous to same location (no animation)
     */
    public setLocation(tile: RoomTile | null): void {
        if (tile) {
            this.x = tile.getX();
            this.y = tile.getY();
            this.z = tile.getStackHeight();
            // Set previous same as current (no animation on initial placement)
            this.previousX = this.x;
            this.previousY = this.y;
            this.previousZ = this.z;
        }
    }

    /**
     * Set position (for initial placement or teleport)
     * Sets both current and previous to same location (no animation)
     */
    public setPosition(x: number, y: number, z: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
        // Set previous same as current (no animation)
        this.previousX = x;
        this.previousY = y;
        this.previousZ = z;
    }

    public setZ(z: number): void {
        this.previousZ = this.z;
        this.z = z;
    }

    public getPreviousX(): number {
        return this.previousX;
    }

    public getPreviousY(): number {
        return this.previousY;
    }

    public getPreviousZ(): number {
        return this.previousZ;
    }

    /**
     * Sync previous location to current location
     * Called AFTER status packet is sent (like Java)
     */
    public syncPreviousLocation(): void {
        this.previousX = this.x;
        this.previousY = this.y;
        this.previousZ = this.z;
    }

    public getHeadRotation(): RoomUserRotation {
        return this.headRotation;
    }

    public setHeadRotation(rotation: RoomUserRotation): void {
        this.headRotation = rotation;
    }

    public getBodyRotation(): RoomUserRotation {
        return this.bodyRotation;
    }

    public setBodyRotation(rotation: RoomUserRotation): void {
        this.bodyRotation = rotation;
    }

    public setRotation(rotation: RoomUserRotation): void {
        this.headRotation = rotation;
        this.bodyRotation = rotation;
    }

    public getUnitType(): RoomUnitType {
        return this.unitType;
    }

    public setUnitType(type: RoomUnitType): void {
        this.unitType = type;
    }

    public isInRoom(): boolean {
        return this.inRoom;
    }

    public setInRoom(inRoom: boolean): void {
        this.inRoom = inRoom;
    }

    public canUserWalk(): boolean {
        return this.canWalk;
    }

    public setCanWalk(canWalk: boolean): void {
        this.canWalk = canWalk;
    }

    // Status methods
    public getStatus(key: string): string | undefined {
        return this.statuses.get(key);
    }

    public setStatus(key: string, value: string): void {
        this.statuses.set(key, value);
    }

    public removeStatus(key: string): void {
        this.statuses.delete(key);
    }

    public hasStatus(key: string): boolean {
        return this.statuses.has(key);
    }

    public clearStatuses(): void {
        this.statuses.clear();
    }

    public getStatusMap(): Map<string, string> {
        return this.statuses;
    }

    /**
     * Get status string (like Java)
     * Format: "/STATUS value/STATUS2 value2/"
     * Example: "/mv 5,3,0.0/" or "/sit 0.5/"
     */
    public getStatusString(): string {
        // Start with /
        let status = '/';

        for (const [key, value] of this.statuses) {
            status += `${key} ${value}/`;
        }

        return status;
    }

    // Walking methods
    public isWalking(): boolean {
        return this.walking;
    }

    public setWalking(walking: boolean): void {
        this.walking = walking;
    }

    public getGoalX(): number {
        return this.goalX;
    }

    public getGoalY(): number {
        return this.goalY;
    }

    public setGoal(x: number, y: number): void {
        this.goalX = x;
        this.goalY = y;
    }

    public getPath(): RoomTile[] {
        return this.path;
    }

    public setPath(path: RoomTile[]): void {
        this.path = path;
        this.pathIndex = 0;
        this.walking = path.length > 0;
        // Clear any pending sit update when new path is set
        this.sitUpdate = false;
    }

    public getNextTile(): RoomTile | null {
        if (this.pathIndex < this.path.length) {
            return this.path[this.pathIndex];
        }
        return null;
    }

    public incrementPath(): void {
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
            this.walking = false;
            this.path = [];
            this.pathIndex = 0;
            // Java: Set sitUpdate flag when path ends - sit check happens on NEXT tick
            this.sitUpdate = true;
        }
    }

    // Java: sitUpdate flag - indicates sit/lay check should happen next tick
    public needsSitUpdate(): boolean {
        return this.sitUpdate;
    }

    public setSitUpdate(value: boolean): void {
        this.sitUpdate = value;
    }

    public clearPath(): void {
        this.path = [];
        this.pathIndex = 0;
        this.walking = false;
        this.goalX = -1;
        this.goalY = -1;
        this.sitUpdate = false;
    }

    public needsStatusUpdate(): boolean {
        return this.needsUpdate;
    }

    public setNeedsUpdate(update: boolean): void {
        this.needsUpdate = update;
    }

    /**
     * Process one movement tick (like Java RoomUnit.cycle())
     * Returns true if status needs to be sent
     *
     * Movement flow (matching Java exactly):
     * 1. If not walking, remove MOVE status and return
     * 2. Get next tile from path
     * 3. Calculate rotation
     * 4. Set MOVE status with target x,y,z
     * 5. Update current position to target
     * 6. Advance path index
     *
     * NOTE: Previous position is NOT updated here!
     * It's updated in sendStatusUpdate AFTER the packet is sent.
     */
    public processMovement(): boolean {
        // Not walking - remove MOVE status if present
        if (!this.walking || !this.room) {
            if (this.hasStatus(RoomUnitStatus.MOVE)) {
                this.removeStatus(RoomUnitStatus.MOVE);
                return true;
            }
            return false;
        }

        // Remove SIT/LAY when walking (like Java)
        this.removeStatus(RoomUnitStatus.SIT);
        this.removeStatus(RoomUnitStatus.LAY);

        // Get next tile
        const nextTile = this.getNextTile();
        if (!nextTile) {
            this.stopWalking();
            return true;
        }

        // Calculate and set rotation
        const rotation = Pathfinder.calculateRotation(this.x, this.y, nextTile.getX(), nextTile.getY());
        this.setRotation(rotation as RoomUserRotation);

        // Calculate target height using Room.getStackHeight (includes furniture)
        // Java: zHeight = room.getLayout().getHeightAtSquare() + item height (if not sit/lay)
        const targetZ = this.room.getStackHeight(nextTile.getX(), nextTile.getY(), true);

        // Set MOVE status with target position (like Java: next.x + "," + next.y + "," + zHeight)
        this.setStatus(RoomUnitStatus.MOVE, `${nextTile.getX()},${nextTile.getY()},${targetZ}`);

        // Update current position to target
        // NOTE: previousX/Y/Z is NOT updated here - it's updated after packet is sent
        this.x = nextTile.getX();
        this.y = nextTile.getY();
        this.z = targetZ;

        // Advance to next tile in path
        this.incrementPath();

        return true;
    }

    public stopWalking(): void {
        this.clearPath();
        this.removeStatus(RoomUnitStatus.MOVE);
        this.needsUpdate = true;
    }

    // === IDLE & LOOK METHODS ===

    /**
     * Reset idle timer (called when user does something)
     */
    public resetIdleTimer(): void {
        this.idleTimer = 0;
        this.lookingAtUser = false;
    }

    /**
     * Increment idle timer
     */
    public incrementIdleTimer(): void {
        this.idleTimer++;
    }

    public getIdleTimer(): number {
        return this.idleTimer;
    }

    /**
     * Check if user is idle (not doing anything for a while)
     */
    public isIdle(): boolean {
        return this.idleTimer > 10; // ~5 seconds at 500ms tick
    }

    /**
     * Look at a specific position
     * Head can turn ±1 from body and lock for 5 seconds
     * If target is behind (±3, ±4), whole body turns
     */
    public lookAt(targetX: number, targetY: number): void {
        if (this.walking) return;
        if (this.x === targetX && this.y === targetY) return;

        const targetRotation = Pathfinder.calculateRotation(this.x, this.y, targetX, targetY);

        // Calculate shortest rotation difference (-4 to +4)
        let diff = targetRotation - this.bodyRotation;
        if (diff > 4) diff -= 8;
        if (diff < -4) diff += 8;

        if (diff === 0) {
            // Already facing target
            this.headRotation = this.bodyRotation;
        } else if (diff === 1 || diff === -1) {
            // Target is slightly to the side - turn head and lock
            this.headRotation = targetRotation as RoomUserRotation;
            this.lockHeadLook(5000); // Lock for 5 seconds
        } else if (diff === 2 || diff === -2) {
            // Target is 90 degrees to the side - turn head to max and lock
            const headDir = (this.bodyRotation + (diff > 0 ? 1 : -1) + 8) % 8;
            this.headRotation = headDir as RoomUserRotation;
            this.lockHeadLook(5000); // Lock for 5 seconds
        } else {
            // Target is behind (±3, ±4) - turn whole body
            this.bodyRotation = targetRotation as RoomUserRotation;
            this.headRotation = targetRotation as RoomUserRotation;
        }

        this.lookingAtUser = true;
        this.lookTargetX = targetX;
        this.lookTargetY = targetY;
        this.needsUpdate = true;
    }

    /**
     * Lock head look for a duration (prevents random head movements)
     */
    private lockHeadLook(duration: number): void {
        this.lastHeadLookTime = Date.now();
        this.headLookDuration = duration;
        this.headLockFromUser = true; // Mark as user look lock
        this.originalHeadRotation = this.headRotation;
    }

    /**
     * Stop looking at user and return head to body direction
     */
    public stopLooking(): void {
        this.lookingAtUser = false;
        this.headRotation = this.bodyRotation;
        this.needsUpdate = true;
    }

    /**
     * Random head look for idle animation
     * Returns true if head was moved
     */
    public doRandomHeadLook(): boolean {
        if (this.walking) return false;
        if (this.hasStatus(RoomUnitStatus.SIT) || this.hasStatus(RoomUnitStatus.LAY)) return false;

        const now = Date.now();

        // Check if head is locked
        if (this.headLookDuration > 0) {
            if (now - this.lastHeadLookTime > this.headLookDuration) {
                // Lock expired
                this.headLookDuration = 0;

                if (this.headLockFromUser) {
                    // Was looking at user - keep head position, just unlock
                    this.headLockFromUser = false;
                    this.lookingAtUser = false;
                    // Head stays where it is - no update needed
                } else {
                    // Was random look - return head to body direction
                    this.headRotation = this.bodyRotation;
                    this.needsUpdate = true;
                    return true;
                }
            }
            return false; // Don't do random look while locked
        }

        // Don't do random look if still looking at user
        if (this.lookingAtUser) return false;

        // Random chance to look (8% per tick when idle)
        if (Math.random() > 0.08) return false;

        // Random head rotation (left or right of body, max ±1 rotation only)
        const randomOffset = Math.random() > 0.5 ? 1 : -1;
        let newRotation = (this.bodyRotation + randomOffset + 8) % 8;
        this.headRotation = newRotation as RoomUserRotation;

        // Set duration (2-4 seconds) - random look, not user look
        this.lastHeadLookTime = now;
        this.headLookDuration = 2000 + Math.random() * 2000;
        this.headLockFromUser = false;

        this.needsUpdate = true;
        return true;
    }

    public isLookingAtUser(): boolean {
        return this.lookingAtUser;
    }

    /**
     * Snap rotation to nearest cardinal direction (N, E, S, W)
     * Used for sitting - Habbo only allows 4 sitting directions
     * 0=N, 2=E, 4=S, 6=W (skip 1,3,5,7 diagonals)
     */
    public snapToCardinalDirection(): void {
        // Map diagonal to nearest cardinal
        // 1 (NE) -> 0 (N) or 2 (E)
        // 3 (SE) -> 2 (E) or 4 (S)
        // 5 (SW) -> 4 (S) or 6 (W)
        // 7 (NW) -> 6 (W) or 0 (N)
        const cardinalMap: Record<number, number> = {
            0: 0, // N -> N
            1: 2, // NE -> E
            2: 2, // E -> E
            3: 4, // SE -> S
            4: 4, // S -> S
            5: 4, // SW -> S
            6: 6, // W -> W
            7: 0  // NW -> N
        };

        this.bodyRotation = cardinalMap[this.bodyRotation] as RoomUserRotation;
        this.headRotation = this.bodyRotation;
    }

    /**
     * Get cardinal direction (for sitting)
     */
    public getCardinalRotation(): RoomUserRotation {
        const cardinalMap: Record<number, number> = {
            0: 0, 1: 2, 2: 2, 3: 4, 4: 4, 5: 4, 6: 6, 7: 0
        };
        return cardinalMap[this.bodyRotation] as RoomUserRotation;
    }

    /**
     * Sit down with proper rotation snapping
     */
    public sit(height: number = 0.5): void {
        if (this.walking) return;

        // Snap to cardinal direction for sitting
        this.snapToCardinalDirection();

        // Set sit status
        this.removeStatus(RoomUnitStatus.LAY);
        this.setStatus(RoomUnitStatus.SIT, height.toFixed(1));
        this.needsUpdate = true;
    }

    /**
     * Lay down
     */
    public lay(height: number = 0.5): void {
        if (this.walking) return;

        this.removeStatus(RoomUnitStatus.SIT);
        this.setStatus(RoomUnitStatus.LAY, height.toFixed(1));
        this.needsUpdate = true;
    }

    // === AFK METHODS ===

    /**
     * Check if user is AFK
     */
    public isAfk(): boolean {
        return this.afk;
    }

    /**
     * Set AFK status
     */
    public setAfk(afk: boolean): void {
        this.afk = afk;
        if (afk) {
            this.afkStartTime = Date.now();
        } else {
            this.afkStartTime = 0;
        }
    }

    /**
     * Get AFK start time
     */
    public getAfkStartTime(): number {
        return this.afkStartTime;
    }

    /**
     * Get AFK duration in minutes
     */
    public getAfkMinutes(): number {
        if (!this.afk || this.afkStartTime === 0) return 0;
        return Math.floor((Date.now() - this.afkStartTime) / 60000);
    }

    /**
     * Get original motto (before AFK)
     */
    public getOriginalMotto(): string {
        return this.originalMotto;
    }

    /**
     * Set original motto
     */
    public setOriginalMotto(motto: string): void {
        this.originalMotto = motto;
    }

    // === EFFECT METHODS ===

    /**
     * Get current effect ID
     */
    public getEffectId(): number {
        return this.effectId;
    }

    /**
     * Set effect ID with optional duration
     */
    public setEffectId(effectId: number, duration: number = -1): void {
        this.effectId = effectId;
        if (duration === -1 || duration === 0) {
            this.effectEndTimestamp = 0; // Permanent or no effect
        } else {
            this.effectEndTimestamp = Math.floor(Date.now() / 1000) + duration;
        }
    }

    /**
     * Get effect end timestamp
     */
    public getEffectEndTimestamp(): number {
        return this.effectEndTimestamp;
    }

    /**
     * Check if effect has expired
     */
    public isEffectExpired(): boolean {
        if (this.effectEndTimestamp === 0) return false;
        return Math.floor(Date.now() / 1000) > this.effectEndTimestamp;
    }

    // === DANCE METHODS ===

    /**
     * Get dance type (0=none, 1-4=dance styles)
     */
    public getDanceType(): number {
        return this.danceType;
    }

    /**
     * Set dance type
     */
    public setDanceType(danceType: number): void {
        this.danceType = danceType;
    }

    /**
     * Check if dancing
     */
    public isDancing(): boolean {
        return this.danceType > 0;
    }
}
