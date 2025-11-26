/**
 * Diffie-Hellman Key Exchange
 * Used for establishing shared secret during handshake
 */

import { createDiffieHellman, DiffieHellman as CryptoDH, randomBytes } from 'crypto';

export class DiffieHellman {
    private dh: CryptoDH;
    private privateKey: Buffer;
    private publicKey: Buffer;
    private sharedSecret: Buffer | null = null;

    // Habbo's DH parameters (same as Java emulator)
    private static readonly PRIME_HEX =
        'bd3910be3c1b3c0e9f13c66ee3d0cbe8cd442c969a9fc3a8c85bdebd2e59d3bbf30e9c0c' +
        '3a9e1d3a3ad7e7c7f0d2bc1a3c6a9f0d5b3e9f0c3a9e1d3a3ad7e7c7f0d2bc1a';

    private static readonly GENERATOR = 2;

    constructor() {
        // Create DH with custom prime or use built-in
        this.dh = createDiffieHellman(256);
        this.privateKey = this.dh.getPrivateKey();
        this.publicKey = this.dh.generateKeys();
    }

    /**
     * Get the public key to send to client
     */
    public getPublicKey(): string {
        return this.publicKey.toString('hex');
    }

    /**
     * Get prime number as hex string
     */
    public getPrime(): string {
        return this.dh.getPrime('hex');
    }

    /**
     * Get generator as hex string
     */
    public getGenerator(): string {
        return this.dh.getGenerator('hex');
    }

    /**
     * Compute shared secret from client's public key
     */
    public computeSharedSecret(clientPublicKey: string): Buffer {
        const clientKey = Buffer.from(clientPublicKey, 'hex');
        this.sharedSecret = this.dh.computeSecret(clientKey);
        return this.sharedSecret;
    }

    /**
     * Get the computed shared secret
     */
    public getSharedSecret(): Buffer | null {
        return this.sharedSecret;
    }

    /**
     * Generate a random token for the handshake
     */
    public static generateToken(): string {
        return randomBytes(16).toString('hex');
    }
}
