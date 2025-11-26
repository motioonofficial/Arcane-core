/**
 * RoomLayout - Represents a room's floor layout
 * Based on Arcturus RoomLayout.java
 */

export class RoomLayout {
    private name: string;
    private doorX: number;
    private doorY: number;
    private doorZ: number = 0;
    private doorDirection: number;
    private heightmap: string;
    private tiles: RoomTile[][] = [];
    private mapSizeX: number = 0;
    private mapSizeY: number = 0;
    private mapSize: number = 0;

    constructor(
        name: string,
        doorX: number,
        doorY: number,
        doorDirection: number,
        heightmap: string
    ) {
        this.name = name;
        this.doorX = doorX;
        this.doorY = doorY;
        this.doorDirection = doorDirection;
        this.heightmap = heightmap;
        this.parseHeightmap();
    }

    private parseHeightmap(): void {
        // Parse like Java: split by \r, rows indexed by y, chars indexed by x
        const modelTemp = this.heightmap.replace(/\n/g, '').split('\r');

        this.mapSize = 0;
        this.mapSizeX = modelTemp[0]?.length || 0;
        this.mapSizeY = modelTemp.length;

        // Initialize tiles array as [x][y] like Java
        this.tiles = [];
        for (let x = 0; x < this.mapSizeX; x++) {
            this.tiles[x] = [];
        }

        for (let y = 0; y < this.mapSizeY; y++) {
            const row = modelTemp[y];
            // Java: if (modelTemp[y].isEmpty() || modelTemp[y].equalsIgnoreCase("\r")) continue;
            if (!row || row.length === 0 || row === '\r') continue;

            for (let x = 0; x < this.mapSizeX; x++) {
                // Java: if (modelTemp[y].length() != this.mapSizeX) break;
                if (row.length !== this.mapSizeX) break;

                const square = row[x].trim().toLowerCase();
                let state = RoomTileState.OPEN;
                let height = 0;

                if (square === 'x') {
                    state = RoomTileState.INVALID;
                } else if (square === '') {
                    height = 0;
                } else if (square >= '0' && square <= '9') {
                    height = parseInt(square);
                } else if (square >= 'a' && square <= 'z') {
                    // Java: height = (short) (10 + "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(square.toUpperCase()));
                    height = 10 + (square.charCodeAt(0) - 'a'.charCodeAt(0));
                }

                // Java increments mapSize for EVERY tile, not just valid ones
                this.mapSize++;
                this.tiles[x][y] = new RoomTile(x, y, height, state);
            }
        }

        // Set door tile properties
        const doorTile = this.getTile(this.doorX, this.doorY);
        if (doorTile) {
            doorTile.setAllowStack(false);

            // Check tile in front of door
            const doorFrontTile = this.getTileInFront(doorTile, this.doorDirection);
            if (doorFrontTile && this.tileExists(doorFrontTile.getX(), doorFrontTile.getY())) {
                const frontTile = this.tiles[doorFrontTile.getX()][doorFrontTile.getY()];
                if (frontTile && frontTile.getState() !== RoomTileState.INVALID) {
                    this.doorZ = frontTile.getZ();
                    doorTile.setState(RoomTileState.OPEN);
                }
            }
        }
    }

    public tileExists(x: number, y: number): boolean {
        return !(x < 0 || y < 0 || x >= this.mapSizeX || y >= this.mapSizeY);
    }

    public getTile(x: number, y: number): RoomTile | null {
        if (!this.tileExists(x, y)) return null;
        return this.tiles[x]?.[y] || null;
    }

    public getTileInFront(tile: RoomTile, rotation: number): RoomTile | null {
        let offsetX = 0;
        let offsetY = 0;

        rotation = rotation % 8;
        switch (rotation) {
            case 0: offsetY--; break;
            case 1: offsetX++; offsetY--; break;
            case 2: offsetX++; break;
            case 3: offsetX++; offsetY++; break;
            case 4: offsetY++; break;
            case 5: offsetX--; offsetY++; break;
            case 6: offsetX--; break;
            case 7: offsetX--; offsetY--; break;
        }

        return this.getTile(tile.getX() + offsetX, tile.getY() + offsetY);
    }

    public getDoorTile(): RoomTile | null {
        return this.getTile(this.doorX, this.doorY);
    }

    public getName(): string {
        return this.name;
    }

    public getDoorX(): number {
        return this.doorX;
    }

    public getDoorY(): number {
        return this.doorY;
    }

    public getDoorDirection(): number {
        return this.doorDirection;
    }

    public getMapSizeX(): number {
        return this.mapSizeX;
    }

    public getMapSizeY(): number {
        return this.mapSizeY;
    }

    public getMapSize(): number {
        return this.mapSize;
    }

    public getDoorZ(): number {
        return this.doorZ;
    }

    /**
     * Get the relative heightmap string for the client (FloorHeightMapComposer)
     * Format: height chars separated by \r for each row
     */
    public getRelativeMap(): string {
        // Java: return this.heightmap.replace("\r\n", "\r");
        return this.heightmap.replace(/\r\n/g, '\r');
    }

    public getHeightmap(): string {
        return this.heightmap;
    }

    /**
     * Update the heightmap and reparse
     */
    public setHeightmap(heightmap: string): void {
        this.heightmap = heightmap;
        this.parseHeightmap();
    }

    /**
     * Update door position
     */
    public setDoorPosition(x: number, y: number, direction: number): void {
        this.doorX = x;
        this.doorY = y;
        this.doorDirection = direction;
        this.parseHeightmap();
    }

    /**
     * Generate heightmap string from current tiles
     */
    public generateHeightmapString(): string {
        const rows: string[] = [];

        for (let y = 0; y < this.mapSizeY; y++) {
            let row = '';
            for (let x = 0; x < this.mapSizeX; x++) {
                const tile = this.tiles[x]?.[y];
                if (!tile || tile.getState() === RoomTileState.INVALID) {
                    row += 'x';
                } else {
                    const height = tile.getZ();
                    if (height <= 9) {
                        row += height.toString();
                    } else if (height <= 35) {
                        row += String.fromCharCode('a'.charCodeAt(0) + height - 10);
                    } else {
                        row += 'x';
                    }
                }
            }
            rows.push(row);
        }

        return rows.join('\r');
    }

    /**
     * Get all tiles as flat array
     */
    public getAllTiles(): RoomTile[] {
        const allTiles: RoomTile[] = [];
        for (let x = 0; x < this.mapSizeX; x++) {
            for (let y = 0; y < this.mapSizeY; y++) {
                const tile = this.tiles[x]?.[y];
                if (tile) {
                    allTiles.push(tile);
                }
            }
        }
        return allTiles;
    }
}

export enum RoomTileState {
    OPEN = 0,
    BLOCKED = 1,
    INVALID = 2,
    SIT = 3,
    LAY = 4
}

export class RoomTile {
    private x: number;
    private y: number;
    private z: number;
    private state: RoomTileState;
    private stackHeight: number;
    private allowStack: boolean = true;

    constructor(x: number, y: number, z: number, state: RoomTileState) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.state = state;
        this.stackHeight = z;
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

    public getState(): RoomTileState {
        return this.state;
    }

    public setState(state: RoomTileState): void {
        this.state = state;
    }

    public getStackHeight(): number {
        return this.stackHeight;
    }

    public setStackHeight(height: number): void {
        if (this.state === RoomTileState.INVALID) {
            this.stackHeight = 32767; // Short.MAX_VALUE
            this.allowStack = false;
            return;
        }

        if (height >= 0 && height !== 32767) {
            this.stackHeight = height;
            this.allowStack = true;
        } else {
            this.allowStack = false;
            this.stackHeight = this.z;
        }
    }

    public getAllowStack(): boolean {
        if (this.state === RoomTileState.INVALID) return false;
        return this.allowStack;
    }

    public setAllowStack(allowStack: boolean): void {
        this.allowStack = allowStack;
    }

    /**
     * Get relative height for HeightMapComposer (RoomRelativeMapComposer in Java)
     * Returns height * 256 as short
     */
    public relativeHeight(): number {
        if (this.state === RoomTileState.INVALID) {
            return 32767; // Short.MAX_VALUE
        } else if (!this.allowStack && (this.state === RoomTileState.BLOCKED || this.state === RoomTileState.SIT)) {
            return 64 * 256;
        }

        return this.allowStack ? Math.floor(this.stackHeight * 256) : 64 * 256;
    }

    public isWalkable(): boolean {
        return this.state === RoomTileState.OPEN;
    }
}
