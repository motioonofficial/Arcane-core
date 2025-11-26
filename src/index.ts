/**
 * Arcane-TS - Habbo Hotel Emulator
 * TypeScript/Bun implementation
 *
 * Entry point
 */

import { emulator } from './core/Emulator';

// Load environment variables
const envFile = Bun.file('.env');
if (await envFile.exists()) {
    const envContent = await envFile.text();
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=');
            if (key && value !== undefined) {
                process.env[key.trim()] = value.trim();
            }
        }
    }
}

// Start the emulator
await emulator.start();
