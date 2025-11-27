<img width="830" height="700" alt="arcanebab" src="https://github.com/user-attachments/assets/599789d8-a9c2-4415-bf7e-ce745f8c8e8c" />


Habbo Hotel Emulator written in TypeScript/Bun - WebSocket support for Nitro Client.

## Requirements

- [Bun](https://bun.sh/) v1.0+
- MySQL 8.0+
- Nitro Client

## Installation

1. Install dependencies:
```bash
cd arcane-ts
bun install
```

2. Create database:
```sql
CREATE DATABASE habbo;
USE habbo;
SOURCE database/users.sql;
```

3. Configure `.env`:
```env
SERVER_HOST=127.0.0.1
SERVER_PORT=2096

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=habbo

LOG_LEVEL=debug
LOG_PACKETS=true
```

4. Start server:
```bash
bun run start
```

## Nitro Client Configuration

In your Nitro client's configuration, set the WebSocket URL:

```json
{
    "socket.url": "ws://127.0.0.1:2096"
}
```

## Testing Login

1. Set SSO ticket in database:
```sql
UPDATE users SET auth_ticket = 'your-sso-ticket' WHERE id = 1;
```

2. Use that ticket in Nitro's login URL:
```
http://your-nitro-url/?sso=your-sso-ticket
```

## Project Structure

```
arcane-ts/
├── src/
│   ├── core/           # Emulator core
│   ├── network/        # WebSocket server
│   ├── messages/       # Packet handlers
│   ├── crypto/         # Encryption (RSA, RC4, DH)
│   ├── database/       # MySQL connection
│   ├── game/           # Game logic
│   └── utils/          # Utilities
├── database/           # SQL files
└── .env                # Configuration
```

## Implemented Features

- [x] WebSocket server (Nitro compatible)
- [x] Handshake (DH, SSO login)
- [x] User authentication
- [x] Basic user info
- [ ] Room system
- [ ] Catalog
- [ ] Navigator
- [ ] Messenger
- [ ] Items/Furniture

## License

MIT
