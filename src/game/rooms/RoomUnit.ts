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

    constructor() {}

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
        }
    }

    public clearPath(): void {
        this.path = [];
        this.pathIndex = 0;
        this.walking = false;
        this.goalX = -1;
        this.goalY = -1;
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

        // Calculate target height
        const targetZ = nextTile.getStackHeight();

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
}
