/**
 * Logger utility for the emulator
 * Provides colored console output with timestamps
 * Supports detailed logging categories via config/logging.json
 */

import { loggingConfig } from '../config/LoggingConfig';
import { getPacketName } from '../messages/HeaderNames';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',

    // Foreground
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',

    // Background
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
    bgGray: '\x1b[100m',
    bgBrightGreen: '\x1b[102m',
    bgBrightYellow: '\x1b[103m',
    bgBrightBlue: '\x1b[104m',
    bgBrightMagenta: '\x1b[105m',
    bgBrightCyan: '\x1b[106m'
};

const levelColors: Record<LogLevel, string> = {
    debug: colors.gray,
    info: colors.cyan,
    warn: colors.yellow,
    error: colors.red
};

const levelLabels: Record<LogLevel, string> = {
    debug: 'DEBUG',
    info: 'INFO ',
    warn: 'WARN ',
    error: 'ERROR'
};

// Request-Response paket eşleşmeleri
const packetPairs: Map<number, number> = new Map([
    // Handshake
    [3110, 1347],  // InitDiffieHandshake -> InitDiffieHandshakeComposer
    [773, 3885],   // CompleteDiffieHandshake -> CompleteDiffieHandshakeComposer
    [2490, 2997],  // UniqueIdEvent -> UniqueIdComposer
    [2419, 2491],  // SSOTicketEvent -> AuthenticationOkComposer

    // Navigator
    [2110, 3052],  // RequestNewNavigatorDataEvent -> NavigatorMetaDataComposer
    [249, 2690],   // RequestNewNavigatorRoomsEvent -> NewNavigatorSearchResultsComposer
    [1782, 518],   // RequestNavigatorSettingsEvent -> NavigatorSettingsComposer

    // Room
    [2230, 687],   // GetGuestRoomEvent -> GetGuestRoomResultComposer
    [2312, 758],   // OpenFlatConnectionEvent -> RoomOpenComposer
    [2300, 1301],  // GetHeightMapEvent -> FloorHeightMapComposer

    // Users
    [357, 2725],   // InfoRetrieveEvent -> UserObjectComposer
    [273, 3475],   // GetCreditsInfoEvent -> CreditBalanceComposer

    // Chat
    [1314, 1446],  // ChatEvent -> ChatComposer
    [2085, 1036],  // ShoutEvent -> ShoutComposer
    [1543, 2704],  // WhisperEvent -> WhisperComposer

    // Movement
    [3320, 1640],  // RoomUserWalkEvent -> RoomUserStatusComposer

    // Ping
    [2596, 3928],  // PongEvent -> PingComposer
    [295, 10],     // LatencyPingRequestEvent -> LatencyResponseComposer
]);

// Son gelen request'leri takip et (eşleştirme için)
const recentRequests: Map<number, { header: number; time: number; data?: string }> = new Map();

export class Logger {
    private context: string;
    private static logLevel: LogLevel = 'info';
    private static logLevelPriority: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };

    constructor(context: string) {
        this.context = context;
    }

    public static setLevel(level: LogLevel): void {
        Logger.logLevel = level;
    }

    private shouldLog(level: LogLevel): boolean {
        return Logger.logLevelPriority[level] >= Logger.logLevelPriority[Logger.logLevel];
    }

    private formatTimestamp(): string {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 19);
    }

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (!this.shouldLog(level)) return;

        const format = loggingConfig.getFormat();
        const timestamp = format.timestamp ? this.formatTimestamp() : '';
        const color = format.colors ? levelColors[level] : '';
        const reset = format.colors ? colors.reset : '';
        const dim = format.colors ? colors.dim : '';
        const cyan = format.colors ? colors.cyan : '';
        const label = levelLabels[level];

        const formattedMessage = args.length > 0
            ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`
            : message;

        let output = '';
        if (format.timestamp) output += `${dim}[${timestamp}]${reset} `;
        output += `${color}[${label}]${reset} `;
        if (format.context) output += `${cyan}[${this.context}]${reset} `;
        output += formattedMessage;

        console.log(output);
    }

    public debug(message: string, ...args: unknown[]): void {
        this.log('debug', message, ...args);
    }

    public info(message: string, ...args: unknown[]): void {
        this.log('info', message, ...args);
    }

    public warn(message: string, ...args: unknown[]): void {
        this.log('warn', message, ...args);
    }

    public error(message: string, ...args: unknown[]): void {
        this.log('error', message, ...args);
    }

    // === DETAILED LOGGING METHODS ===

    /**
     * Log incoming/outgoing packets with names and data
     */
    public packet(direction: 'IN' | 'OUT', header: number, data?: string): void {
        if (!loggingConfig.shouldLogPackets()) return;

        const config = loggingConfig.packets;
        if (direction === 'IN' && !config.incoming) return;
        if (direction === 'OUT' && !config.outgoing) return;

        const timestamp = this.formatTimestamp();
        const packetName = config.showName ? getPacketName(header, direction) : '';

        // Eşleşen paket var mı kontrol et
        let isPaired = false;
        let pairInfo = '';

        if (direction === 'IN') {
            // Gelen paketi kaydet
            recentRequests.set(header, { header, time: Date.now(), data });
        } else {
            // Giden paket için eşleşme ara
            for (const [reqHeader, resHeader] of packetPairs) {
                if (resHeader === header) {
                    const request = recentRequests.get(reqHeader);
                    if (request && Date.now() - request.time < 5000) {
                        isPaired = true;
                        const reqName = getPacketName(reqHeader, 'IN');
                        pairInfo = reqName;
                        recentRequests.delete(reqHeader);
                    }
                    break;
                }
            }
        }

        let output = '';

        if (isPaired) {
            // Eşleşen paketler için özel format (soft yeşil)
            output += `${colors.dim}[${timestamp}]${colors.reset} `;
            output += `${colors.green}⟷${colors.reset} `;
            output += `${colors.gray}${pairInfo}${colors.reset}`;
            output += ` ${colors.dim}→${colors.reset} `;
            output += `${colors.green}${packetName}${colors.reset}`;
            output += ` ${colors.dim}(${header})${colors.reset}`;
        } else {
            // Normal paket formatı (soft renkler)
            const dirColor = direction === 'IN' ? colors.blue : colors.magenta;
            const arrow = direction === 'IN' ? '←' : '→';
            const dirLabel = direction === 'IN' ? 'IN ' : 'OUT';

            output += `${colors.dim}[${timestamp}]${colors.reset} `;
            output += `${dirColor}${arrow} ${dirLabel}${colors.reset} `;

            if (config.showName) {
                output += `${colors.white}${packetName}${colors.reset}`;
                output += ` ${colors.dim}(${header})${colors.reset}`;
            } else {
                output += `Header: ${colors.white}${header}${colors.reset}`;
            }
        }

        if (config.showData && data) {
            output += `\n    ${colors.gray}└─ Data: ${data}${colors.reset}`;
        }

        console.log(output);
    }

    /**
     * Log packet with parsed data values
     */
    public packetWithData(direction: 'IN' | 'OUT', header: number, values: Record<string, unknown>): void {
        if (!loggingConfig.shouldLogPackets()) return;

        const config = loggingConfig.packets;
        if (direction === 'IN' && !config.incoming) return;
        if (direction === 'OUT' && !config.outgoing) return;

        const timestamp = this.formatTimestamp();
        const packetName = config.showName ? getPacketName(header, direction) : '';
        const dirColor = direction === 'IN' ? colors.blue : colors.magenta;
        const arrow = direction === 'IN' ? '←' : '→';
        const dirLabel = direction === 'IN' ? 'IN ' : 'OUT';

        let output = `${colors.dim}[${timestamp}]${colors.reset} `;
        output += `${dirColor}${arrow} ${dirLabel}${colors.reset} `;

        if (config.showName) {
            output += `${colors.white}${packetName}${colors.reset}`;
            output += ` ${colors.dim}(${header})${colors.reset}`;
        } else {
            output += `Header: ${colors.white}${header}${colors.reset}`;
        }

        // Değerleri güzel formatta göster
        if (config.showData && Object.keys(values).length > 0) {
            const valueStrs = Object.entries(values).map(([key, val]) => {
                const valStr = typeof val === 'string' ? `"${val}"` : String(val);
                return `${colors.gray}${key}${colors.reset}=${colors.white}${valStr}${colors.reset}`;
            });
            output += `\n    ${colors.dim}└─${colors.reset} ${valueStrs.join(', ')}`;
        }

        console.log(output);
    }

    /**
     * Log movement details (position, path, rotation)
     */
    public movement(userId: number, username: string, data: {
        fromX?: number;
        fromY?: number;
        fromZ?: number;
        toX?: number;
        toY?: number;
        toZ?: number;
        rotation?: number;
        pathLength?: number;
        action?: string;
    }): void {
        if (!loggingConfig.shouldLogMovement()) return;

        const config = loggingConfig.movement;
        const timestamp = this.formatTimestamp();

        let output = `${colors.dim}[${timestamp}]${colors.reset} `;
        output += `${colors.cyan}~${colors.reset} `;
        output += `${colors.white}${username}${colors.reset} ${colors.dim}(${userId})${colors.reset}`;

        if (data.action) {
            const actionColor = data.action === 'WALK_START' ? colors.green :
                               data.action === 'PATH_NOT_FOUND' ? colors.red : colors.yellow;
            output += ` ${colors.dim}[${colors.reset}${actionColor}${data.action}${colors.reset}${colors.dim}]${colors.reset}`;
        }

        const details: string[] = [];

        if (config.showPosition && data.fromX !== undefined && data.toX !== undefined) {
            details.push(`${colors.dim}from${colors.reset}=(${data.fromX},${data.fromY}) ${colors.dim}→${colors.reset} ${colors.dim}to${colors.reset}=(${data.toX},${data.toY})`);
        } else if (config.showPosition && data.toX !== undefined) {
            details.push(`${colors.dim}pos${colors.reset}=(${data.toX},${data.toY},${data.toZ?.toFixed(2) || 0})`);
        }

        if (config.showRotation && data.rotation !== undefined) {
            details.push(`${colors.dim}rot${colors.reset}=${data.rotation}`);
        }

        if (config.showPath && data.pathLength !== undefined) {
            details.push(`${colors.dim}path${colors.reset}=${data.pathLength} tiles`);
        }

        if (details.length > 0) {
            output += `\n    ${colors.dim}└─ ${details.join(' | ')}${colors.reset}`;
        }

        console.log(output);
    }

    /**
     * Log room events (entry, exit, load)
     */
    public room(event: 'entry' | 'exit' | 'load' | 'unload', data: {
        roomId: number;
        roomName?: string;
        userId?: number;
        username?: string;
        userCount?: number;
    }): void {
        if (!loggingConfig.shouldLogRooms()) return;

        const config = loggingConfig.rooms;
        if (event === 'entry' && !config.showEntry) return;
        if (event === 'exit' && !config.showExit) return;
        if ((event === 'load' || event === 'unload') && !config.showLoad) return;

        const timestamp = this.formatTimestamp();
        const eventConfig: Record<string, { color: string; symbol: string; label: string }> = {
            entry: { color: colors.green, symbol: '+', label: 'ENTER' },
            exit: { color: colors.yellow, symbol: '-', label: 'EXIT' },
            load: { color: colors.blue, symbol: '◆', label: 'LOAD' },
            unload: { color: colors.gray, symbol: '◇', label: 'UNLOAD' }
        };

        const { color, symbol, label } = eventConfig[event];

        let output = `${colors.dim}[${timestamp}]${colors.reset} `;
        output += `${color}${symbol}${colors.reset} `;
        output += `${colors.dim}[${label}]${colors.reset} `;
        output += `${colors.white}${data.roomName || 'Unknown'}${colors.reset}`;
        output += ` ${colors.dim}(${data.roomId})${colors.reset}`;

        const details: string[] = [];
        if (data.username) {
            details.push(`${colors.dim}user${colors.reset}=${data.username}`);
        }
        if (data.userCount !== undefined) {
            details.push(`${colors.dim}users${colors.reset}=${data.userCount}`);
        }

        if (details.length > 0) {
            output += `\n    ${colors.dim}└─ ${details.join(' | ')}${colors.reset}`;
        }

        console.log(output);
    }

    /**
     * Log chat messages
     */
    public chat(type: 'talk' | 'shout' | 'whisper', data: {
        userId: number;
        username: string;
        message: string;
        targetUsername?: string;
        roomId?: number;
    }): void {
        if (!loggingConfig.shouldLogChat()) return;

        const config = loggingConfig.chat;
        if (!config.showMessages && type !== 'whisper') return;
        if (!config.showWhispers && type === 'whisper') return;

        const timestamp = this.formatTimestamp();
        const typeConfig: Record<string, { color: string; symbol: string }> = {
            talk: { color: colors.white, symbol: '◯' },
            shout: { color: colors.yellow, symbol: '!' },
            whisper: { color: colors.magenta, symbol: '*' }
        };

        const { color, symbol } = typeConfig[type];

        let output = `${colors.dim}[${timestamp}]${colors.reset} `;
        output += `${color}${symbol}${colors.reset} `;
        output += `${colors.white}${data.username}${colors.reset}`;

        if (type === 'whisper' && data.targetUsername) {
            output += ` ${colors.dim}→${colors.reset} ${colors.white}${data.targetUsername}${colors.reset}`;
        }

        output += `${colors.dim}:${colors.reset} ${colors.gray}"${data.message}"${colors.reset}`;

        console.log(output);
    }

    /**
     * Log user events (login, logout, actions)
     */
    public user(event: 'login' | 'logout' | 'action', data: {
        userId: number;
        username: string;
        action?: string;
        ip?: string;
    }): void {
        if (!loggingConfig.shouldLogUsers()) return;

        const config = loggingConfig.users;
        if (event === 'login' && !config.showLogin) return;
        if (event === 'logout' && !config.showLogout) return;
        if (event === 'action' && !config.showActions) return;

        const timestamp = this.formatTimestamp();
        const eventConfig: Record<string, { color: string; symbol: string; label: string }> = {
            login: { color: colors.green, symbol: '●', label: 'LOGIN' },
            logout: { color: colors.yellow, symbol: '○', label: 'LOGOUT' },
            action: { color: colors.cyan, symbol: '•', label: 'ACTION' }
        };

        const { color, symbol, label } = eventConfig[event];

        let output = `${colors.dim}[${timestamp}]${colors.reset} `;
        output += `${color}${symbol}${colors.reset} `;
        output += `${colors.dim}[${label}]${colors.reset} `;
        output += `${colors.white}${data.username}${colors.reset}`;
        output += ` ${colors.dim}(${data.userId})${colors.reset}`;

        const details: string[] = [];
        if (data.ip) {
            details.push(`${colors.dim}ip${colors.reset}=${data.ip}`);
        }
        if (data.action) {
            details.push(`${colors.dim}action${colors.reset}=${data.action}`);
        }

        if (details.length > 0) {
            output += `\n    ${colors.dim}└─ ${details.join(' | ')}${colors.reset}`;
        }

        console.log(output);
    }

    /**
     * Log network events
     */
    public network(event: 'connect' | 'disconnect' | 'error', data: {
        clientId: number;
        ip?: string;
        reason?: string;
        error?: string;
    }): void {
        if (!loggingConfig.shouldLogNetwork()) return;

        const config = loggingConfig.network;
        if (event === 'connect' && !config.showConnections) return;
        if (event === 'disconnect' && !config.showDisconnections) return;
        if (event === 'error' && !config.showErrors) return;

        const timestamp = this.formatTimestamp();
        const eventConfig: Record<string, { color: string; symbol: string; label: string }> = {
            connect: { color: colors.green, symbol: '↔', label: 'CONNECT' },
            disconnect: { color: colors.yellow, symbol: '×', label: 'DISCONNECT' },
            error: { color: colors.red, symbol: '!', label: 'ERROR' }
        };

        const { color, symbol, label } = eventConfig[event];

        let output = `${colors.dim}[${timestamp}]${colors.reset} `;
        output += `${color}${symbol}${colors.reset} `;
        output += `${colors.dim}[${label}]${colors.reset} `;
        output += `Client #${colors.white}${data.clientId}${colors.reset}`;

        const details: string[] = [];
        if (data.ip) {
            details.push(`${colors.dim}ip${colors.reset}=${data.ip}`);
        }
        if (data.reason) {
            details.push(`${colors.dim}reason${colors.reset}=${data.reason}`);
        }
        if (data.error) {
            details.push(`${colors.red}error${colors.reset}=${data.error}`);
        }

        if (details.length > 0) {
            output += `\n    ${colors.dim}└─ ${details.join(' | ')}${colors.reset}`;
        }

        console.log(output);
    }

    /**
     * Log database queries (for debugging)
     */
    public database(type: 'query' | 'error', data: {
        query?: string;
        params?: unknown[];
        error?: string;
        duration?: number;
    }): void {
        if (!loggingConfig.shouldLogDatabase()) return;

        const config = loggingConfig.database;
        if (type === 'query' && !config.showQueries) return;
        if (type === 'error' && !config.showErrors) return;

        const timestamp = this.formatTimestamp();
        const color = type === 'error' ? colors.red : colors.gray;
        const symbol = type === 'error' ? '!' : '▪';
        const label = type === 'error' ? 'ERROR' : 'QUERY';

        let output = `${colors.dim}[${timestamp}]${colors.reset} `;
        output += `${color}${symbol}${colors.reset} `;
        output += `${colors.dim}[DB ${label}]${colors.reset} `;

        if (data.query) {
            const shortQuery = data.query.length > 80 ? data.query.substring(0, 80) + '...' : data.query;
            output += `${colors.gray}${shortQuery}${colors.reset}`;
        }

        if (data.duration !== undefined) {
            output += ` ${colors.dim}(${data.duration}ms)${colors.reset}`;
        }

        if (data.error) {
            output += `\n    ${colors.dim}└─${colors.reset} ${colors.red}${data.error}${colors.reset}`;
        }

        console.log(output);
    }
}
