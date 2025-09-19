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
# Build TypeScript
npm run build

# Track positions with daily schedule
npm run track

# Track positions with daily schedule using DATA_FILE_PATH for DB
npm run track-local

# Track positions once immediately
npm run track:once

# # Track positions once immediately using DATA_FILE_PATH for DB
npm run track-local:once

# Generate HTML report from existing data
npm run report

# Generate HTML report from existing data using DATA_FILE_PATH for DB
npm run report-local

# Production commands (uses compiled JS)
npm run prod:track
npm run prod:track:once
npm run prod:report
```

## HTML Reports

The tracker generates an HTML report at `docs/index.html` showing:

- Historical position values
- Fee accumulation over time
- Price changes with percentages
- In/Out of range status
- 24-hour fee differences

## GitHub Actions Deployment

The repository includes two automated workflows:

### 1. Track Positions and Deploy

- **Schedule**: Daily at 22:30 UTC (00:30 Sofia time)
- **Manual Trigger**: Available via workflow_dispatch
- **Actions**: Tracks positions, saves to Supabase, generates report, deploys to GitHub Pages

### 2. Generate Report from Supabase

- **Triggers**: On push to main branch or manual dispatch
- **Actions**: Generates HTML report from Supabase data, deploys to GitHub Pages
- **Note**: Doesn't require WALLET_ADDRESS (only reads existing data)

### Setup

1. Add required secrets to GitHub repository:
   - `WALLET_ADDRESS` or `POSITION_ID`
   - `GRAPH_API_KEY` (optional but recommended)
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Enable GitHub Pages in repository settings (Source: GitHub Actions)
3. Access your live report at: `https://[username].github.io/uniswap-position-tracker/`

## Project Structure

```
├── src/
│   ├── index.ts                      # Main entry point
│   ├── client/
│   │   ├── uniswapPositionTracker.ts # Main orchestration class
│   │   └── uniswapClient.ts         # Graph API & calculations
│   ├── storage/
│   │   ├── dataStorage.ts           # Local file persistence
│   │   └── supabaseStorage.ts       # Supabase cloud storage
│   ├── services/
│   │   ├── scheduler.ts             # Cron scheduling (timezone-aware)
│   │   └── htmlGenerator.ts         # HTML report generation
│   ├── config/
│   │   ├── index.ts                 # Config loading & validation
│   │   └── schema.ts                # Config TypeScript interfaces
│   ├── constants/
│   │   └── index.ts                 # Centralized constants
│   ├── schemas/
│   │   └── index.ts                 # Query builders for The Graph API
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   └── utils/
│       └── index.ts                 # Utility functions
├── docs/
│   └── index.html                   # Generated HTML report (GitHub Pages)
├── data/                            # Local output directory (git-ignored)
│   └── positions.json               # Historical position data
├── .github/
│   └── workflows/
│       ├── generate-report.yml      # Report generation workflow
│       └── track-positions-and-deploy.yml  # Daily tracking workflow
├── .env                             # Configuration (create from .env.example)
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies
```

## License

MIT

## Author

Yavor Radulov
