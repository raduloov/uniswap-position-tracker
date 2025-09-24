# Uniswap Position Tracker

Automated tracking system for Uniswap V3 liquidity positions with historical data logging, web reporting, and Telegram notifications.

## Features

- 📊 **Multi-chain Support**: Tracks positions on Ethereum and Arbitrum
- 💰 **Comprehensive Analytics**: Calculates USD values, uncollected fees, and P/L tracking
- 📈 **Price Monitoring**: Shows real-time price changes with percentage movements
- 🔔 **Telegram Notifications**: Real-time updates with portfolio summaries and alerts
- 🕐 **Automated Tracking**: Daily snapshots via cron scheduler
- 🌐 **Web Reports**: HTML reports with historical data visualization
- ☁️ **Cloud Storage**: Optional Supabase integration for data persistence
- 🚀 **CI/CD**: Automated deployment via GitHub Actions to GitHub Pages

## Quick Start

### Prerequisites

- Node.js 20+
- Uniswap V3 position ID or wallet address
- (Optional) Graph API key from [The Graph](https://thegraph.com/studio/apikeys/)
- (Optional) Telegram bot for notifications

### Installation

```bash
git clone https://github.com/yourusername/uniswap-position-tracker.git
cd uniswap-position-tracker
npm install
```

### Configuration

Create `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Required (choose one)
WALLET_ADDRESS=0x...        # Track all positions for wallet
POSITION_ID=12345          # Track specific position

# Optional - API Keys
GRAPH_API_KEY=your-key     # For better reliability (recommended)

# Optional - Telegram Integration
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Optional - Supabase Cloud Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Schedule Configuration
SCHEDULE_TIME=09:00        # Daily run time (24h format)

# Local Storage (if not using Supabase)
DATA_FILE_PATH=./data/positions.json
```

### Usage

```bash
# Build TypeScript
npm run build

# Track positions with daily schedule
npm run track

# Track positions once immediately
npm run track:once

# Track positions locally (ignores Supabase)
npm run track-local
npm run track-local:once

# Generate HTML report
npm run report
npm run report-local  # Uses local file instead of Supabase

# Send Telegram notification
npm run telegram
npm run telegram:local  # Uses local file instead of Supabase

# Production commands (uses compiled JS)
npm run prod:track:once
npm run prod:report
npm run prod:telegram
```

## GitHub Actions Deployment

The repository includes automated workflows:

### 1. Track Positions and Deploy

- **Schedule**: Daily at 22:30 UTC
- **Manual Trigger**: Available via workflow_dispatch
- **Actions**:
  - Tracks positions from both chains
  - Saves to Supabase
  - Sends Telegram notifications (if configured)
  - Generates HTML report
  - Deploys to GitHub Pages

### 2. Generate Report from Supabase

- **Triggers**: On push to main branch or manual dispatch
- **Actions**:
  - Generates HTML report from Supabase data
  - Deploys to GitHub Pages
- **Note**: Doesn't require WALLET_ADDRESS (only reads existing data)

### Setup

1. Add required secrets to GitHub repository:
   - `WALLET_ADDRESS` or `POSITION_ID`
   - `GRAPH_API_KEY` (optional but recommended)
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (optional)
2. Enable GitHub Pages in repository settings (Source: GitHub Actions)
3. Access your live report at: `https://[username].github.io/uniswap-position-tracker/`

## Notifications Setup

### Telegram Bot

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your bot token from BotFather
3. Get your chat ID:
   - Send a message to your bot
   - Visit `https://api.telegram.org/bot<YourBotToken>/getUpdates`
   - Find your chat ID in the response
4. Add to `.env`:
   - `TELEGRAM_BOT_TOKEN=your-bot-token`
   - `TELEGRAM_CHAT_ID=your-chat-id`

## Multi-Chain Support

The tracker supports multiple blockchain networks:

- **Ethereum Mainnet**
- **Arbitrum One**

Each position is tracked with chain-specific data and displayed with appropriate badges in reports.

## Project Structure

```
├── src/
│   ├── index.ts                      # Main entry point
│   ├── notifyTelegram.ts            # Telegram notification script
│   ├── client/
│   │   ├── uniswapPositionTracker.ts # Main orchestration
│   │   └── uniswapClient.ts         # Graph API & calculations
│   ├── storage/
│   │   ├── dataStorage.ts           # Local file persistence
│   │   └── supabaseStorage.ts       # Cloud storage
│   ├── services/
│   │   ├── scheduler.ts             # Cron scheduling
│   │   ├── htmlGenerator.ts         # HTML report generation
│   │   └── telegramNotifier.ts      # Telegram integration
│   ├── config/
│   │   └── index.ts                 # Configuration management
│   ├── constants/
│   │   ├── index.ts                 # Core constants
│   │   └── colors.ts                # Color definitions
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   └── utils/
│       ├── position.ts              # Position calculations
│       ├── formatting.ts            # Formatting utilities
│       ├── positionHistory.ts       # History management
│       └── summary.ts               # Portfolio summaries
├── docs/
│   ├── index.html                   # Generated report
│   └── assets/                      # Chain logos and assets
├── .github/
│   └── workflows/                   # GitHub Actions
└── CLAUDE.md                        # Detailed documentation
```

## License

MIT

## Author

Yavor Radulov
