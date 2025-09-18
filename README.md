# Uniswap Position Tracker

Automated tracking system for Uniswap V3 liquidity positions with historical data logging and web reporting.

## Features

- 📊 Tracks Uniswap V3 positions with real-time data from The Graph
- 💰 Calculates USD values and uncollected fees
- 📈 Shows price changes between snapshots (percentage)
- 🕐 Automated daily tracking via cron scheduler
- 🌐 Generates HTML reports with historical data
- ☁️ Optional Supabase integration for data storage
- 🚀 GitHub Actions deployment to GitHub Pages

## Quick Start

### Prerequisites
- Node.js 20+
- Uniswap V3 position ID or wallet address
- (Optional) Graph API key from [The Graph](https://thegraph.com/studio/apikeys/)

### Installation

```bash
git clone https://github.com/yourusername/uniswap-position-tracker.git
cd uniswap-position-tracker
npm install
```

### Configuration

Create `.env` file:

```env
# Required (choose one)
WALLET_ADDRESS=0x...        # Track all positions for wallet
POSITION_ID=12345          # Track specific position

# Optional
GRAPH_API_KEY=your-key     # For better reliability
SCHEDULE_TIME=09:00        # Daily run time (24h format)
DATA_FILE_PATH=./data/positions.json

# Optional - Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Usage

```bash
# Run once immediately
npm run dev:once

# Run with daily schedule
npm run dev

# Build and run production
npm run build
npm start
```

## HTML Reports

The tracker generates an HTML report at `docs/index.html` showing:
- Historical position values
- Fee accumulation over time
- Price changes with percentages
- In/Out of range status
- 24-hour fee differences

## GitHub Actions Deployment

The repository includes a workflow that:
1. Runs position tracking every hour (GitHub's actual frequency varies)
2. Generates HTML report
3. Deploys to GitHub Pages

Enable GitHub Pages in repository settings (Source: GitHub Actions).

## Project Structure

```
├── src/
│   ├── index.ts                 # Main entry point
│   ├── client/
│   │   └── uniswapClient.ts    # Graph API client
│   ├── services/
│   │   ├── scheduler.ts        # Cron scheduler
│   │   └── htmlGenerator.ts    # HTML report generator
│   ├── storage/
│   │   ├── dataStorage.ts      # Local file storage
│   │   └── supabaseStorage.ts  # Cloud storage
│   └── config/, types/, utils/ # Supporting modules
├── data/                        # Position data (git-ignored)
├── docs/                        # HTML reports
└── .github/workflows/           # GitHub Actions
```

## License

MIT

## Author

Yavor Radulov