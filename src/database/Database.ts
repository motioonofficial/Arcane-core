/**
 * Database - MySQL Connection Pool Manager
 * Uses mysql2 with promise-based API
 */

import { createPool, Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { config } from '../config/Configuration';
import { Logger } from '../utils/Logger';

export class Database {
    private pool: Pool | null = null;
    private logger = new Logger('Database');

    /**
     * Initialize the connection pool
     */
    public async connect(): Promise<void> {
        try {
            this.pool = createPool({
                host: config.database.host,
                port: config.database.port,
                user: config.database.user,
                password: config.database.password,
                database: config.database.database,
                waitForConnections: true,
                connectionLimit: 20,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            });

            // Test connection
            const connection = await this.pool.getConnection();
            connection.release();

            this.logger.info(`Connected to MySQL at ${config.database.host}:${config.database.port}`);
        } catch (error) {
            this.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * Close all connections
     */
    public async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.logger.info('Database connections closed');
        }
    }

    /**
     * Get a connection from the pool
     */
    public async getConnection(): Promise<PoolConnection> {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        return this.pool.getConnection();
    }

    /**
     * Execute a query and return rows
     */
    public async query<T = any>(
        sql: string,
        params?: unknown[]
    ): Promise<T> {
        if (!this.pool) {
            throw new Error('Database not connected');
        }

        const [rows] = await this.pool.execute(sql, params);
        return rows as T;
    }

    /**
     * Execute a query and return result (for INSERT, UPDATE, DELETE)
     */
    public async execute(
        sql: string,
        params?: unknown[]
    ): Promise<ResultSetHeader> {
        if (!this.pool) {
            throw new Error('Database not connected');
        }

        const [result] = await this.pool.execute<ResultSetHeader>(sql, params);
        return result;
    }

    /**
     * Execute a query and return first row or null
     */
    public async queryOne<T = any>(
        sql: string,
        params?: unknown[]
    ): Promise<T | null> {
        const rows = await this.query<T[]>(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Execute multiple queries in a transaction
     */
    public async transaction<T>(
        callback: (connection: PoolConnection) => Promise<T>
    ): Promise<T> {
        const connection = await this.getConnection();

        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Check if pool is connected
     */
    public isConnected(): boolean {
        return this.pool !== null;
    }

    /**
     * Get pool statistics
     */
    public getPoolStats(): { total: number; idle: number; waiting: number } | null {
        if (!this.pool) return null;

        // Use type assertion with unknown to avoid TS error
        const poolInternal = (this.pool as any).pool as {
            _allConnections?: { length: number };
            _freeConnections?: { length: number };
            _connectionQueue?: { length: number };
        } | undefined;

        return {
            total: poolInternal?._allConnections?.length || 0,
            idle: poolInternal?._freeConnections?.length || 0,
            waiting: poolInternal?._connectionQueue?.length || 0
        };
    }
}
