# Uniswap Position Tracker - Project Context

## Project Overview

This is a TypeScript application that automatically tracks Uniswap V3 liquidity provider positions daily and logs the data to a JSON file. It uses The Graph Protocol to fetch on-chain data without requiring direct RPC access.

## Key Features

- **Multi-chain support**: Fetches positions from both Ethereum and Arbitrum chains
- Fetches all active Uniswap V3 positions for a wallet address
- Calculates accurate token amounts using Uniswap V3 math
- Determines USD values using stablecoin references (USDT, USDC, etc.)
- Displays human-readable price ranges (not ticks)
- Tracks uncollected fees with USD values
- Runs automatically at scheduled time daily using node-cron
- Saves historical data to JSON file for trend analysis
- Generates HTML reports with historical position tracking tables
- Tracks 24-hour fee changes between position snapshots
- Chain-specific badges with logos in HTML reports
- Telegram bot notifications for position updates and alerts

## Technical Architecture

### Data Source

- Uses The Graph Protocol's Uniswap V3 subgraphs via REST API
- **Ethereum endpoint**: `https://gateway.thegraph.com/api/[api-key]/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`
- **Arbitrum endpoint**: `https://gateway.thegraph.com/api/[api-key]/subgraphs/id/HyW7A86UEdYVt5b9Lrw8W2F98yKecerHKutZTRbSCX27`
- Sends GraphQL-formatted queries via axios POST requests (not using a GraphQL client)
- Can work without API key using development endpoint (rate limited)
- Recommended to get free API key from https://thegraph.com/studio/apikeys/

### Core Components

1. **src/index.ts**

   - Main application entry point
   - Imports and instantiates `UniswapPositionTracker` class from client module
   - Handles command-line flags (`--once`, `--report`)
   - Proper error handling with exit code 1 for GitHub Actions

2. **src/client/uniswapPositionTracker.ts**

   - Main class orchestrating all functionality
   - Creates separate clients for Ethereum and Arbitrum chains
   - Fetches positions from both chains in parallel using Promise.all
   - Handles scheduling and position checking
   - Supports both Supabase and local file storage
   - Enhanced console output with formatting, timezone display, and chain breakdown

3. **src/client/uniswapClient.ts**

   - Handles all Graph API interactions
   - Supports multiple chains via Chain enum parameter
   - Implements Uniswap V3 math for position calculations
   - Uses modularized utilities and schemas
   - Handles zero liquidity positions gracefully (avoids NaN values)
   - Key methods:
     - `getPositions()`: Fetches positions from Graph
     - `transformPosition()`: Converts Graph data to our format
     - `getAmountsForLiquidity()`: Calculates token amounts from liquidity
     - `calculateFeeGrowthInside()`: Calculates uncollected fees

4. **src/storage/dataStorage.ts**

   - Manages JSON file persistence
   - Appends new data to maintain history
   - Type-safe with TypeScript interfaces

5. **src/storage/supabaseStorage.ts**

   - Handles Supabase database operations
   - Stores position snapshots in cloud database
   - Enables GitHub Actions to generate reports without local files
   - Optional - falls back to local storage if not configured

6. **src/services/scheduler.ts**

   - Handles cron-based scheduling
   - Runs task at specified time daily
   - Timezone-aware (uses Sofia timezone)

7. **src/services/htmlGenerator.ts**
   - Generates HTML reports from position data
   - Supports both Supabase and local file data sources
   - Creates historical tracking tables for each position
   - Shows daily snapshots with key metrics:
     - Total Value (USD)
     - Total Fees (USD)
     - 24h Fee changes
     - Position Range and Current Price
     - In/Out of Range status
   - Responsive design with modern UI
   - Groups positions by ID for multi-position tracking
   - Deployed to GitHub Pages via Actions

8. **src/services/telegramNotifier.ts**
   - Handles Telegram bot notifications
   - Sends formatted position updates with portfolio summaries
   - Tracks significant price changes and fee movements
   - Supports emoji indicators for better readability
   - Calculates P/L and percentage changes
   - Groups positions by chain for clear organization

9. **src/services/arbitrumFeeFetcher.ts**
   - Fetches fee growth data for Arbitrum positions
   - Makes direct RPC calls to Arbitrum network
   - Retrieves tick data from Uniswap pool contracts
   - Workaround for missing fee data in Arbitrum subgraph

10. **src/notifyTelegram.ts**
    - Standalone script for sending Telegram notifications
    - Reads latest position data from storage
    - Calculates portfolio summaries and changes
    - Detects significant position changes for alerts
    - Can be run independently via npm script

### Modular Architecture

11. **src/config/**

   - `index.ts`: Environment variable loading and validation
   - `schema.ts`: TypeScript interfaces for configuration
   - Validates required parameters (WALLET_ADDRESS or POSITION_ID)
   - Skips validation in GitHub Actions environment (detects via GITHUB_ACTIONS env var)

12. **src/constants/**

    - `index.ts`: Centralized constants and configuration
    - `colors.ts`: Color definitions for HTML reports and UI
   - Graph API configuration for multiple chains:
     - Ethereum subgraph endpoint
     - Arbitrum subgraph endpoint
   - Uniswap V3 math constants (Q32, Q96, Q128)
   - Stablecoin symbols for USD value determination
   - Timezone configuration

13. **src/types/**

    - `index.ts`: TypeScript interfaces and enums
    - `GraphQLPosition`: Graph API response structure
    - `PositionData`: Internal position data model with chain field
    - `Chain`: Enum for supported chains (ETHEREUM, ARBITRUM)
    - Clear separation between API and internal types

14. **src/schemas/**

    - `index.ts`: Query string builders for The Graph API
    - `buildPositionByIdQuery()`: Builds query for single position
    - `buildPositionsByOwnerQuery()`: Builds query for wallet positions
    - Reusable field definitions for maintainability
    - Note: Builds GraphQL-formatted query strings but sends via REST API (axios POST)

15. **src/utils/**
    - `index.ts`: Core utility functions
    - `formatting.ts`: Number and string formatting utilities
    - `position.ts`: Position calculation helpers
    - `positionHistory.ts`: Historical data management
    - `summary.ts`: Portfolio summary calculations
    - `getGraphEndpoint(chain)`: Constructs Graph API endpoint for specified chain
    - `getSqrtPriceX96FromTick()`: Uniswap V3 tick-to-price conversion
    - `isGithubActionsEnv`: Detects GitHub Actions environment
    - Mathematical helper functions

## Important Implementation Details

### Price Calculations

- The Graph's `token0Price` and `token1Price` fields are confusingly named:
  - `token0Price` actually represents "token1 per token0"
  - `token1Price` actually represents "token0 per token1"
- For WETH/USDT pools, we invert prices to show WETH price in USDT

### Fee Calculations

- Uses Uniswap V3's fee growth tracking mechanism
- Formula: `uncollectedFees = liquidity * (feeGrowthInside - feeGrowthInside0LastX128) / 2^128`
- **Ethereum**: The Graph subgraph provides complete tick data including `feeGrowthOutside0X128` and `feeGrowthOutside1X128` fields directly in the GraphQL response - single API call gets everything
- **Arbitrum**: The Graph subgraph doesn't include fee growth data in tick objects, so the app makes additional RPC calls to `https://arb1.arbitrum.io/rpc` to fetch tick data directly from the Uniswap pool contract using `eth_call` with the `ticks()` function
- The Ethereum approach is more efficient (fewer network calls, lower latency) while Arbitrum requires 2 extra RPC calls per position as a workaround

### Price Range Display

- Converts ticks to human-readable prices
- For WETH/USDT: shows range in USDT (e.g., $4,400 - $4,800)
- Uses relative calculation from current price for accuracy
- Enhanced mathematical precision with BigInt operations
- Range status indicators (✅/❌) for in-range visualization

### USD Value Determination

- Identifies stablecoins (USDT, USDC, DAI, etc.) and uses them as $1 reference
- For WETH/USDT pool:
  - USDT = $1 (stablecoin)
  - WETH price = token1Price from Graph (already in USDT terms)

## Configuration (.env)

```env
# Required for local runs (unless POSITION_ID is provided)
# Not required in GitHub Actions environment
WALLET_ADDRESS=0x...

# Optional but recommended for reliability
GRAPH_API_KEY=your-api-key-here

# Optional: Track specific position instead of all wallet positions
POSITION_ID=12345

# Optional: Supabase configuration for cloud storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Telegram bot configuration
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Daily run time (24-hour format)
SCHEDULE_TIME=09:00

# Output file location (used when Supabase not configured)
DATA_FILE_PATH=./data/positions.json
```

## Usage Commands

```bash
# Build TypeScript
npm run build

# Track positions continuously with daily schedule
npm run track

# Track positions once immediately
npm run track:once

# Track positions locally (ignores Supabase)
npm run track-local
npm run track-local:once

# Generate HTML report from existing data
npm run report
npm run report-local  # Uses local file instead of Supabase

# Send Telegram notification
npm run telegram

# Production commands (uses compiled JS)
npm run prod:track:once
npm run prod:report
npm run prod:telegram
```

## Data Structure

The app saves position data in JSON format with:

- **Chain identifier**: Which blockchain the position is on (ethereum/arbitrum)
- Token amounts and USD values
- Liquidity and fee tier
- Price range (ticks and human-readable)
- Uncollected fees with USD values
- Pool state (address, current tick, sqrtPrice)
- Timestamp and date for historical tracking

### HTML Report Features

- **Historical Position Table**: Each position tracked over time
- **Chain Badges**: Visual indicators with logos for Ethereum/Arbitrum chains
- **Date Format**: Day of week + date (e.g., THU, SEP 18)
- **24h Fees Column**: Shows fee changes between snapshots (+$X.XX or -$X.XX)
- **Current Price Column**: Shows current price with percentage change from previous entry in parentheses (e.g., $3,450.23 (+2.45%))
- **Price Change Indicators**: Color-coded percentage changes (green for positive, red for negative)
- **Status Badges**: Visual indicators for In Range/Out of Range
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-generated**: Updates with each cron run
- **Logo Assets**: Uses SVG logos from docs/assets folder

## Known Issues and Solutions

### Issue: Graph API deprecated old endpoints

**Solution**: Updated to use new Graph Network endpoints with optional API key

### Issue: Price calculations were showing astronomical numbers

**Solution**: Fixed decimal adjustments and used relative price calculations from current price

### Issue: Uncollected fees were incorrect

**Solution**: Implemented proper Uniswap V3 fee growth calculation using feeGrowthInside

### Issue: USD prices were wrong for WETH

**Solution**: Recognized that Graph's token prices are exchange rates, used stablecoin as reference

### Issue: Zero liquidity positions showing NaN values

**Solution**: Added proper NaN checks and defaults to 0 for out-of-range positions

## Multi-Chain Implementation

### Supported Chains

- **Ethereum Mainnet**: Primary chain support
- **Arbitrum One**: Layer 2 support for lower fees and faster transactions

### How It Works

1. Creates separate `UniswapClient` instances for each chain
2. Fetches positions from both chains in parallel using `Promise.all`
3. Combines results and displays chain breakdown in console
4. Each position includes chain identifier in data structure
5. HTML reports show chain badges with appropriate logos

### Console Output

```
Found X active position(s)
  - Ethereum: Y position(s)
  - Arbitrum: Z position(s)
```

## Future Enhancements

- Add support for additional chains (Polygon, Optimism, Base, etc.)
- Email notifications for significant changes
- Web dashboard for visualization
- Support for Uniswap V2 positions
- Automatic fee collection when threshold reached
- Integration with tax reporting tools

## GitHub Actions Workflows

The project includes two GitHub Actions workflows for automation:

### 1. Track Positions and Deploy (`track-positions-and-deploy.yml`)

**Triggers:**

- **Schedule**: Daily at 22:30 UTC (00:30 Sofia time) via cron
- **Manual**: Can be triggered manually via `workflow_dispatch`

**What it does:**

1. Checks out the repository
2. Sets up Node.js 20 with npm caching
3. Caches TypeScript build output for faster runs
4. Installs dependencies
5. Builds TypeScript (if not cached)
6. Runs position tracker once (`npm run prod:track:once`)
7. Sends Telegram notifications (if configured)
8. Generates HTML report with latest data
9. Deploys to GitHub Pages

**Required Secrets:**

- `WALLET_ADDRESS` or `POSITION_ID` - Track specific wallet/position
- `GRAPH_API_KEY` - The Graph API key (optional but recommended)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)
- `TELEGRAM_CHAT_ID` - Telegram chat ID (optional)

### 2. Generate Report from Supabase (`generate-report.yml`)

**Triggers:**

- **Push**: Automatically on push to `main` branch
- **Manual**: Can be triggered manually via `workflow_dispatch`

**What it does:**

1. Checks out the repository
2. Sets up Node.js 20 with npm caching
3. Installs dependencies
4. Builds TypeScript
5. Generates HTML report from existing Supabase data (`npm run prod:report`)
6. Deploys to GitHub Pages

**Required Secrets:**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- Note: Does NOT require `WALLET_ADDRESS` since it only reads existing data

### Workflow Features

- **Concurrency Control**: Uses concurrency groups to prevent overlapping deployments
- **GitHub Pages Deployment**: Both workflows deploy to GitHub Pages at the end
- **Build Caching**: The tracking workflow caches TypeScript builds for efficiency
- **Environment Detection**: Code automatically detects `GITHUB_ACTIONS` environment variable
- **Error Handling**: Process exits with code 1 on errors for proper CI/CD failure detection

## Testing

To test the application:

1. Set up `.env` with valid wallet address (for local runs)
2. Run `npm run track:once` for immediate test
3. Check `data/positions.json` for output (if not using Supabase)
4. Check `docs/index.html` for HTML report
5. Verify calculations match Uniswap interface

## Dependencies

- **axios**: HTTP client for Graph API
- **node-cron**: Scheduling daily runs
- **dotenv**: Environment variable management
- **typescript/tsx**: TypeScript support
- **@supabase/supabase-js**: Supabase client for cloud storage

## Project Structure

```
uniswap-position-tracker/
├── src/
│   ├── index.ts                      # Main entry point
│   ├── notifyTelegram.ts            # Telegram notification script
│   ├── client/
│   │   ├── uniswapPositionTracker.ts # Main orchestration class
│   │   └── uniswapClient.ts         # Graph API & calculations
│   ├── storage/
│   │   ├── dataStorage.ts           # Local file persistence
│   │   └── supabaseStorage.ts       # Supabase cloud storage
│   ├── services/
│   │   ├── scheduler.ts             # Cron scheduling (timezone-aware)
│   │   ├── htmlGenerator.ts         # HTML report generation
│   │   ├── telegramNotifier.ts      # Telegram bot integration
│   │   └── arbitrumFeeFetcher.ts    # Arbitrum fee data fetcher
│   ├── config/
│   │   ├── index.ts                 # Config loading & validation
│   │   └── schema.ts                # Config TypeScript interfaces
│   ├── constants/
│   │   ├── index.ts                 # Centralized constants
│   │   └── colors.ts                # Color definitions for UI
│   ├── schemas/
│   │   └── index.ts                 # GraphQL query builders
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   └── utils/
│       ├── index.ts                 # Core utility functions
│       ├── formatting.ts            # Formatting utilities
│       ├── position.ts              # Position calculations
│       ├── positionHistory.ts       # History management
│       └── summary.ts               # Portfolio summaries
├── docs/
│   ├── index.html                   # Generated HTML report (GitHub Pages)
│   └── assets/                      # Chain logos and assets
├── data/                            # Local output directory
│   └── positions.json               # Historical position data
├── .github/
│   └── workflows/
│       ├── generate-report.yml      # Report generation workflow
│       └── track-positions-and-deploy.yml  # Daily tracking workflow
├── .env                             # Configuration
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies
```

## Maintenance Notes

- The Graph endpoints may change; check https://thegraph.com for updates
- Uniswap V3 math is complex; be careful when modifying calculations
- Always test with small positions first
- Keep historical data backed up
- Math constants are centralized in `src/constants/index.ts`
- Query strings for The Graph API can be modified in `src/schemas/index.ts`
- Configuration validation:
  - Local runs require either WALLET_ADDRESS or POSITION_ID
  - GitHub Actions environment automatically skips validation
  - Process exits with code 1 on errors for proper CI/CD failure detection
- **IMPORTANT**: Use `npm run track-local:once` for development
- **IMPORTANT**: Always run `npm run typecheck` after making code changes to ensure type safety
