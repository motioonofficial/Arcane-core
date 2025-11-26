/**
 * ClientMessage - Incoming packet parser
 * Reads data from client packets using Habbo protocol format
 *
 * Packet structure:
 * [2 bytes: header][N bytes: payload]
 */

export class ClientMessage {
    private header: number;
    private buffer: Buffer;
    private position: number = 0;

    constructor(data: Buffer) {
        if (data.length < 2) {
            throw new Error('Invalid packet: too short');
        }

        // Read header (2 bytes, big-endian short)
        this.header = data.readInt16BE(0);
        this.buffer = data.subarray(2);
        this.position = 0;
    }

    /**
     * Get the packet header/message ID
     */
    public getHeader(): number {
        return this.header;
    }

    /**
     * Get remaining bytes in packet
     */
    public getRemainingLength(): number {
        return this.buffer.length - this.position;
    }

    /**
     * Check if there's more data to read
     */
    public hasMoreData(): boolean {
        return this.position < this.buffer.length;
    }

    /**
     * Reset read position to beginning
     */
    public reset(): void {
        this.position = 0;
    }

    /**
     * Read a boolean (1 byte)
     */
    public readBoolean(): boolean {
        if (this.position >= this.buffer.length) {
            return false;
        }
        return this.buffer[this.position++] === 1;
    }

    /**
     * Read a byte (1 byte)
     */
    public readByte(): number {
        if (this.position >= this.buffer.length) {
            return 0;
        }
        return this.buffer[this.position++];
    }

    /**
     * Read a short (2 bytes, big-endian)
     */
    public readShort(): number {
        if (this.position + 2 > this.buffer.length) {
            return 0;
        }
        const value = this.buffer.readInt16BE(this.position);
        this.position += 2;
        return value;
    }

    /**
     * Read an unsigned short (2 bytes, big-endian)
     */
    public readUShort(): number {
        if (this.position + 2 > this.buffer.length) {
            return 0;
        }
        const value = this.buffer.readUInt16BE(this.position);
        this.position += 2;
        return value;
    }

    /**
     * Read an integer (4 bytes, big-endian)
     */
    public readInt(): number {
        if (this.position + 4 > this.buffer.length) {
            return 0;
        }
        const value = this.buffer.readInt32BE(this.position);
        this.position += 4;
        return value;
    }

    /**
     * Read an unsigned integer (4 bytes, big-endian)
     */
    public readUInt(): number {
        if (this.position + 4 > this.buffer.length) {
            return 0;
        }
        const value = this.buffer.readUInt32BE(this.position);
        this.position += 4;
        return value;
    }

    /**
     * Read a string (2 byte length prefix + UTF-8 data)
     */
    public readString(): string {
        const length = this.readUShort();
        if (length === 0 || this.position + length > this.buffer.length) {
            return '';
        }

        const value = this.buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        return value;
    }

    /**
     * Read raw bytes
     */
    public readBytes(length: number): Buffer {
        if (this.position + length > this.buffer.length) {
            return Buffer.alloc(0);
        }

        const value = this.buffer.subarray(this.position, this.position + length);
        this.position += length;
        return value;
    }

    /**
     * Read remaining bytes
     */
    public readRemainingBytes(): Buffer {
        const value = this.buffer.subarray(this.position);
        this.position = this.buffer.length;
        return value;
    }

    /**
     * Read a long (8 bytes, big-endian)
     */
    public readLong(): bigint {
        if (this.position + 8 > this.buffer.length) {
            return 0n;
        }
        const value = this.buffer.readBigInt64BE(this.position);
        this.position += 8;
        return value;
    }

    /**
     * Read a float (4 bytes)
     */
    public readFloat(): number {
        if (this.position + 4 > this.buffer.length) {
            return 0;
        }
        const value = this.buffer.readFloatBE(this.position);
        this.position += 4;
        return value;
    }

    /**
     * Read a double (8 bytes)
     */
    public readDouble(): number {
        if (this.position + 8 > this.buffer.length) {
            return 0;
        }
        const value = this.buffer.readDoubleBE(this.position);
        this.position += 8;
        return value;
    }

    /**
     * Get full packet as hex string for debugging
     */
    public toHexString(): string {
        return this.buffer.toString('hex');
    }

    /**
     * Get packet info for logging
     */
    public toString(): string {
        return `ClientMessage[header=${this.header}, length=${this.buffer.length}]`;
    }
}
