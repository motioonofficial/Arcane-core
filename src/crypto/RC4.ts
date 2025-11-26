/**
 * RC4 Stream Cipher
 * Used for encrypting/decrypting packets after handshake
 */

export class RC4 {
    private state: number[] = new Array(256);
    private i: number = 0;
    private j: number = 0;

    constructor(key: Buffer) {
        this.initialize(key);
    }

    /**
     * Initialize the RC4 state with the key
     */
    private initialize(key: Buffer): void {
        // KSA (Key-Scheduling Algorithm)
        for (let i = 0; i < 256; i++) {
            this.state[i] = i;
        }

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + this.state[i] + key[i % key.length]) & 0xFF;
            // Swap
            [this.state[i], this.state[j]] = [this.state[j], this.state[i]];
        }

        this.i = 0;
        this.j = 0;
    }

    /**
     * Generate next byte of keystream
     */
    private nextByte(): number {
        this.i = (this.i + 1) & 0xFF;
        this.j = (this.j + this.state[this.i]) & 0xFF;

        // Swap
        [this.state[this.i], this.state[this.j]] = [this.state[this.j], this.state[this.i]];

        return this.state[(this.state[this.i] + this.state[this.j]) & 0xFF];
    }

    /**
     * Encrypt data (XOR with keystream)
     */
    public encrypt(data: Buffer): Buffer {
        const result = Buffer.alloc(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ this.nextByte();
        }
        return result;
    }

    /**
     * Decrypt data (same as encrypt for RC4)
     */
    public decrypt(data: Buffer): Buffer {
        return this.encrypt(data);
    }

    /**
     * Reset the cipher state (for testing)
     */
    public reset(key: Buffer): void {
        this.initialize(key);
    }
}
