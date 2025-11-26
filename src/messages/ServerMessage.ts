/**
 * ServerMessage - Outgoing packet composer
 * Builds packets to send to clients using Habbo protocol format
 *
 * Packet structure:
 * [2 bytes: header][N bytes: payload]
 *
 * Note: Length prefix is added by GameClient.send()
 */

export class ServerMessage {
    private header: number;
    private chunks: Buffer[] = [];
    private totalLength: number = 0;

    constructor(header: number) {
        this.header = header;
    }

    /**
     * Get the packet header
     */
    public getHeader(): number {
        return this.header;
    }

    /**
     * Get total payload length
     */
    public getLength(): number {
        return this.totalLength;
    }

    /**
     * Append a boolean (1 byte)
     */
    public appendBoolean(value: boolean): this {
        const buf = Buffer.alloc(1);
        buf[0] = value ? 1 : 0;
        this.chunks.push(buf);
        this.totalLength += 1;
        return this;
    }

    /**
     * Append a byte (1 byte)
     */
    public appendByte(value: number): this {
        const buf = Buffer.alloc(1);
        buf[0] = value & 0xFF;
        this.chunks.push(buf);
        this.totalLength += 1;
        return this;
    }

    /**
     * Append a short (2 bytes, big-endian)
     */
    public appendShort(value: number): this {
        const buf = Buffer.alloc(2);
        buf.writeInt16BE(value, 0);
        this.chunks.push(buf);
        this.totalLength += 2;
        return this;
    }

    /**
     * Append an unsigned short (2 bytes, big-endian)
     */
    public appendUShort(value: number): this {
        const buf = Buffer.alloc(2);
        buf.writeUInt16BE(value, 0);
        this.chunks.push(buf);
        this.totalLength += 2;
        return this;
    }

    /**
     * Append an integer (4 bytes, big-endian)
     */
    public appendInt(value: number): this {
        const buf = Buffer.alloc(4);
        buf.writeInt32BE(value, 0);
        this.chunks.push(buf);
        this.totalLength += 4;
        return this;
    }

    /**
     * Append an unsigned integer (4 bytes, big-endian)
     */
    public appendUInt(value: number): this {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(value, 0);
        this.chunks.push(buf);
        this.totalLength += 4;
        return this;
    }

    /**
     * Append a string (2 byte length prefix + UTF-8 data)
     */
    public appendString(value: string): this {
        const strBuf = Buffer.from(value, 'utf8');
        const lenBuf = Buffer.alloc(2);
        lenBuf.writeUInt16BE(strBuf.length, 0);

        this.chunks.push(lenBuf);
        this.chunks.push(strBuf);
        this.totalLength += 2 + strBuf.length;
        return this;
    }

    /**
     * Append raw bytes
     */
    public appendBytes(value: Buffer): this {
        this.chunks.push(value);
        this.totalLength += value.length;
        return this;
    }

    /**
     * Append a long (8 bytes, big-endian)
     */
    public appendLong(value: bigint): this {
        const buf = Buffer.alloc(8);
        buf.writeBigInt64BE(value, 0);
        this.chunks.push(buf);
        this.totalLength += 8;
        return this;
    }

    /**
     * Append a float (4 bytes)
     */
    public appendFloat(value: number): this {
        const buf = Buffer.alloc(4);
        buf.writeFloatBE(value, 0);
        this.chunks.push(buf);
        this.totalLength += 4;
        return this;
    }

    /**
     * Append a double (8 bytes)
     */
    public appendDouble(value: number): this {
        const buf = Buffer.alloc(8);
        buf.writeDoubleBE(value, 0);
        this.chunks.push(buf);
        this.totalLength += 8;
        return this;
    }

    /**
     * Compose the final packet buffer
     * Returns: [2 bytes header][payload]
     */
    public compose(): Buffer {
        // Header (2 bytes) + payload
        const result = Buffer.alloc(2 + this.totalLength);

        // Write header
        result.writeInt16BE(this.header, 0);

        // Write payload chunks
        let offset = 2;
        for (const chunk of this.chunks) {
            chunk.copy(result, offset);
            offset += chunk.length;
        }

        return result;
    }

    /**
     * Get packet as hex string for debugging
     */
    public toHexString(): string {
        return this.compose().toString('hex');
    }

    /**
     * Get packet info for logging
     */
    public toString(): string {
        return `ServerMessage[header=${this.header}, length=${this.totalLength}]`;
    }
}
