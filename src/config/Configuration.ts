/**
 * Configuration Manager
 * Loads and manages all emulator configuration from environment variables
 */
export interface ServerConfig {
    host: string;
    port: number;
    maxConnections: number;
}

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

export interface CryptoConfig {
    enabled: boolean;
    rsaN: string;
    rsaE: string;
    rsaD: string;
}

export interface LogConfig {
    level: string;
    logPackets: boolean;
}

export class Configuration {
    private static instance: Configuration;

    public server: ServerConfig;
    public database: DatabaseConfig;
    public crypto: CryptoConfig;
    public log: LogConfig;

    private constructor() {
        this.server = {
            host: process.env.SERVER_HOST || '127.0.0.1',
            port: parseInt(process.env.SERVER_PORT || '2096'),
            maxConnections: parseInt(process.env.SERVER_MAX_CONNECTIONS || '1000')
        };

        this.database = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'habbo'
        };

        this.crypto = {
            enabled: process.env.CRYPTO_ENABLED === 'true',
            rsaN: process.env.CRYPTO_RSA_N || '',
            rsaE: process.env.CRYPTO_RSA_E || '3',
            rsaD: process.env.CRYPTO_RSA_D || ''
        };

        this.log = {
            level: process.env.LOG_LEVEL || 'info',
            logPackets: process.env.LOG_PACKETS === 'true'
        };
    }

    public static getInstance(): Configuration {
        if (!Configuration.instance) {
            Configuration.instance = new Configuration();
        }
        return Configuration.instance;
    }

    public reload(): void {
        Configuration.instance = new Configuration();
    }
}

export const config = Configuration.getInstance();
