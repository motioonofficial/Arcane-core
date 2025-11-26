/**
 * HeightmapValidator - Validates and parses room heightmaps
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
    width?: number;
    height?: number;
    doorValid?: boolean;
}

export interface ParsedHeightmap {
    width: number;
    height: number;
    tiles: string[][];
    tileCount: number;
}

export class HeightmapValidator {
    // Valid heightmap characters: x = void, 0-9 = heights 0-9, a-z = heights 10-35
    private static readonly VALID_CHARS = /^[x0-9a-z]$/i;
    private static readonly MIN_SIZE = 2;
    private static readonly MAX_SIZE = 64;
    private static readonly MAX_HEIGHT = 35; // 'z' = 35

    /**
     * Validate a heightmap string
     */
    public static validate(
        heightmap: string,
        doorX: number,
        doorY: number
    ): ValidationResult {
        if (!heightmap || heightmap.trim().length === 0) {
            return { valid: false, error: 'Heightmap is empty' };
        }

        const parsed = this.parse(heightmap);
        if (!parsed) {
            return { valid: false, error: 'Failed to parse heightmap' };
        }

        // Check dimensions
        if (parsed.width < this.MIN_SIZE || parsed.height < this.MIN_SIZE) {
            return {
                valid: false,
                error: `Heightmap too small (min ${this.MIN_SIZE}x${this.MIN_SIZE})`
            };
        }

        if (parsed.width > this.MAX_SIZE || parsed.height > this.MAX_SIZE) {
            return {
                valid: false,
                error: `Heightmap too large (max ${this.MAX_SIZE}x${this.MAX_SIZE})`
            };
        }

        // Check for at least one walkable tile
        if (parsed.tileCount === 0) {
            return { valid: false, error: 'Heightmap has no walkable tiles' };
        }

        // Validate all characters
        for (let y = 0; y < parsed.height; y++) {
            for (let x = 0; x < parsed.width; x++) {
                const char = parsed.tiles[y]?.[x];
                if (!char || !this.isValidChar(char)) {
                    return {
                        valid: false,
                        error: `Invalid character at (${x}, ${y}): '${char}'`
                    };
                }
            }
        }

        // Validate door position
        const doorValid = this.isDoorPositionValid(parsed.tiles, doorX, doorY);
        if (!doorValid) {
            return {
                valid: false,
                error: `Invalid door position (${doorX}, ${doorY})`,
                width: parsed.width,
                height: parsed.height,
                doorValid: false
            };
        }

        return {
            valid: true,
            width: parsed.width,
            height: parsed.height,
            doorValid: true
        };
    }

    /**
     * Parse heightmap string into 2D array
     */
    public static parse(heightmap: string): ParsedHeightmap | null {
        try {
            // Normalize line endings and split into rows
            const normalizedMap = heightmap.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const rows = normalizedMap.split('\n').filter(row => row.length > 0);

            if (rows.length === 0) {
                return null;
            }

            const height = rows.length;
            const width = Math.max(...rows.map(row => row.length));

            const tiles: string[][] = [];
            let tileCount = 0;

            for (let y = 0; y < height; y++) {
                tiles[y] = [];
                for (let x = 0; x < width; x++) {
                    const char = rows[y]?.[x]?.toLowerCase() || 'x';
                    tiles[y][x] = char;

                    if (char !== 'x') {
                        tileCount++;
                    }
                }
            }

            return { width, height, tiles, tileCount };
        } catch {
            return null;
        }
    }

    /**
     * Check if character is valid for heightmap
     */
    public static isValidChar(char: string): boolean {
        return this.VALID_CHARS.test(char);
    }

    /**
     * Check if door position is valid (must be on a walkable tile)
     */
    public static isDoorPositionValid(
        tiles: string[][],
        doorX: number,
        doorY: number
    ): boolean {
        // Check bounds
        if (doorY < 0 || doorY >= tiles.length) {
            return false;
        }

        if (doorX < 0 || doorX >= (tiles[doorY]?.length || 0)) {
            return false;
        }

        // Door must be on a walkable tile (not 'x')
        const doorTile = tiles[doorY]?.[doorX]?.toLowerCase();
        return doorTile !== undefined && doorTile !== 'x';
    }

    /**
     * Convert heightmap character to numeric height
     */
    public static charToHeight(char: string): number {
        const c = char.toLowerCase();

        if (c === 'x') {
            return -1; // Void/blocked
        }

        // 0-9
        if (c >= '0' && c <= '9') {
            return parseInt(c, 10);
        }

        // a-z = 10-35
        if (c >= 'a' && c <= 'z') {
            return c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
        }

        return -1;
    }

    /**
     * Convert numeric height to heightmap character
     */
    public static heightToChar(height: number): string {
        if (height < 0) {
            return 'x';
        }

        if (height <= 9) {
            return height.toString();
        }

        if (height <= 35) {
            return String.fromCharCode('a'.charCodeAt(0) + height - 10);
        }

        return 'x'; // Invalid height
    }

    /**
     * Create a default square heightmap
     */
    public static createDefault(width: number, height: number): string {
        const safeWidth = Math.max(this.MIN_SIZE, Math.min(width, this.MAX_SIZE));
        const safeHeight = Math.max(this.MIN_SIZE, Math.min(height, this.MAX_SIZE));

        const rows: string[] = [];
        for (let y = 0; y < safeHeight; y++) {
            rows.push('0'.repeat(safeWidth));
        }

        return rows.join('\r\n');
    }

    /**
     * Serialize tiles back to heightmap string
     */
    public static serialize(tiles: string[][]): string {
        return tiles.map(row => row.join('')).join('\r\n');
    }
}
