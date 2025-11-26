/**
 * RSA Encryption
 * Used for initial handshake security
 */

import { config } from '../config/Configuration';

export class RSA {
    private n: bigint;
    private e: bigint;
    private d: bigint;

    constructor() {
        // Load RSA parameters from config
        this.n = BigInt('0x' + config.crypto.rsaN);
        this.e = BigInt(config.crypto.rsaE);
        this.d = BigInt('0x' + config.crypto.rsaD);
    }

    /**
     * Encrypt data using public key (n, e)
     */
    public encrypt(data: Buffer): Buffer {
        const m = this.bufferToBigInt(data);
        const c = this.modPow(m, this.e, this.n);
        return this.bigIntToBuffer(c);
    }

    /**
     * Decrypt data using private key (n, d)
     */
    public decrypt(data: Buffer): Buffer {
        const c = this.bufferToBigInt(data);
        const m = this.modPow(c, this.d, this.n);
        return this.bigIntToBuffer(m);
    }

    /**
     * Sign data (encrypt with private key)
     */
    public sign(data: Buffer): Buffer {
        const m = this.bufferToBigInt(data);
        const s = this.modPow(m, this.d, this.n);
        return this.bigIntToBuffer(s);
    }

    /**
     * Verify signature (decrypt with public key)
     */
    public verify(signature: Buffer): Buffer {
        return this.encrypt(signature);
    }

    /**
     * Modular exponentiation: (base^exp) mod mod
     */
    private modPow(base: bigint, exp: bigint, mod: bigint): bigint {
        let result = 1n;
        base = base % mod;

        while (exp > 0n) {
            if (exp % 2n === 1n) {
                result = (result * base) % mod;
            }
            exp = exp >> 1n;
            base = (base * base) % mod;
        }

        return result;
    }

    /**
     * Convert Buffer to BigInt
     */
    private bufferToBigInt(buffer: Buffer): bigint {
        const hex = buffer.toString('hex');
        if (hex.length === 0) return 0n;
        return BigInt('0x' + hex);
    }

    /**
     * Convert BigInt to Buffer
     */
    private bigIntToBuffer(value: bigint): Buffer {
        let hex = value.toString(16);
        if (hex.length % 2 !== 0) {
            hex = '0' + hex;
        }
        return Buffer.from(hex, 'hex');
    }

    /**
     * Get the public modulus (n) as hex string
     */
    public getModulus(): string {
        return this.n.toString(16);
    }

    /**
     * Get the public exponent (e)
     */
    public getExponent(): string {
        return this.e.toString();
    }
}
