# Uniswap Position Tracker - Project Context

## Project Overview
This is a TypeScript application that automatically tracks Uniswap V3 liquidity provider positions daily and logs the data to a JSON file. It uses The Graph Protocol to fetch on-chain data without requiring direct RPC access.

## Key Features
- Fetches all active Uniswap V3 positions for a wallet address
- Calculates accurate token amounts using Uniswap V3 math
- Determines USD values using stablecoin references (USDT, USDC, etc.)
- Displays human-readable price ranges (not ticks)
- Tracks uncollected fees with USD values
- Runs automatically at scheduled time daily using node-cron
- Saves historical data to JSON file for trend analysis
- Generates HTML reports with historical position tracking tables
- Tracks 24-hour fee changes between position snapshots

## Technical Architecture

### Data Source
- Uses The Graph Protocol's Uniswap V3 subgraph
- Endpoint: `https://gateway.thegraph.com/api/[api-key]/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`
- Can work without API key using development endpoint (rate limited)
- Recommended to get free API key from https://thegraph.com/studio/apikeys/

### Core Components

1. **src/index.ts**
   - Main application entry point
   - Class-based architecture with `UniswapPositionTracker` class
   - Handles scheduling and orchestration
   - Supports `--once` flag for single run
   - Enhanced console output with formatting and timezone display

2. **src/uniswapClient.ts**
   - Handles all Graph API interactions
   - Implements Uniswap V3 math for position calculations
   - Uses modularized utilities and schemas
   - Key methods:
     - `getPositions()`: Fetches positions from Graph
     - `transformPosition()`: Converts Graph data to our format
     - `getAmountsForLiquidity()`: Calculates token amounts from liquidity
     - `calculateFeeGrowthInside()`: Calculates uncollected fees

3. **src/dataStorage.ts**
   - Manages JSON file persistence
   - Appends new data to maintain history
   - Type-safe with TypeScript interfaces

4. **src/scheduler.ts**
   - Handles cron-based scheduling
   - Runs task at specified time daily
   - Timezone-aware (uses Sofia timezone)

5. **src/htmlGenerator.ts**
   - Generates HTML reports from position data
   - Creates historical tracking tables for each position
   - Shows daily snapshots with key metrics:
     - Total Value (USD)
     - Total Fees (USD)
     - 24h Fee changes
     - Position Range and Current Price
     - In/Out of Range status
   - Responsive design with modern UI
   - Groups positions by ID for multi-position tracking

### Modular Architecture

6. **src/config/**
   - `index.ts`: Environment variable loading and validation
   - `schema.ts`: TypeScript interfaces for configuration
   - Validates required parameters (WALLET_ADDRESS or POSITION_ID)

7. **src/constants/**
   - `index.ts`: Centralized constants and configuration
   - Graph API configuration (endpoints, limits)
   - Uniswap V3 math constants (Q32, Q96, Q128)
   - Stablecoin symbols for USD value determination
   - Timezone configuration

8. **src/types/**
   - `index.ts`: TypeScript interfaces
   - `GraphQLPosition`: Graph API response structure
   - `PositionData`: Internal position data model
   - Clear separation between API and internal types

9. **src/schemas/**
   - `index.ts`: GraphQL query builders
   - `buildPositionByIdQuery()`: Query single position
   - `buildPositionsByOwnerQuery()`: Query wallet positions
   - Reusable field definitions for maintainability

10. **src/utils/**
   - `index.ts`: Utility functions
   - `getGraphEndpoint()`: Constructs Graph API endpoint
   - `getSqrtPriceX96FromTick()`: Uniswap V3 tick-to-price conversion
   - Mathematical helper functions

## Important Implementation Details

### Price Calculations
- The Graph's `token0Price` and `token1Price` fields are confusingly named:
  - `token0Price` actually represents "token1 per token0" 
  - `token1Price` actually represents "token0 per token1"
- For WETH/USDT pools, we invert prices to show WETH price in USDT

### Fee Calculations
- Uses Uniswap V3's fee growth tracking mechanism
- Requires `feeGrowthGlobal0X128`, `feeGrowthOutside0X128`, etc. from Graph
- Formula: `uncollectedFees = liquidity * (feeGrowthInside - feeGrowthInside0LastX128) / 2^128`

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
# Required (unless POSITION_ID is provided)
WALLET_ADDRESS=0x...

# Optional but recommended for reliability
GRAPH_API_KEY=your-api-key-here

# Optional: Track specific position instead of all wallet positions
POSITION_ID=12345

# Daily run time (24-hour format)
SCHEDULE_TIME=09:00

# Output file location
DATA_FILE_PATH=./data/positions.json
```

## Usage Commands

```bash
# Run continuously with daily schedule
npm run dev

# Run once immediately
npm run dev -- --once

# Build TypeScript
npm run build

# Run production build
npm start
```

## Data Structure

The app saves position data in JSON format with:
- Token amounts and USD values
- Liquidity and fee tier
- Price range (ticks and human-readable)
- Uncollected fees with USD values
- Pool state (address, current tick, sqrtPrice)
- Timestamp and date for historical tracking

### HTML Report Features
- **Historical Position Table**: Each position tracked over time
- **Date Format**: Day of week + date (e.g., THU, SEP 18)
- **24h Fees Column**: Shows fee changes between snapshots (+$X.XX or -$X.XX)
- **Status Badges**: Visual indicators for In Range/Out of Range
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-generated**: Updates with each cron run

## Known Issues and Solutions

### Issue: Graph API deprecated old endpoints
**Solution**: Updated to use new Graph Network endpoints with optional API key

### Issue: Price calculations were showing astronomical numbers
**Solution**: Fixed decimal adjustments and used relative price calculations from current price

### Issue: Uncollected fees were incorrect
**Solution**: Implemented proper Uniswap V3 fee growth calculation using feeGrowthInside

### Issue: USD prices were wrong for WETH
**Solution**: Recognized that Graph's token prices are exchange rates, used stablecoin as reference

## Future Enhancements
- Add support for multiple chains (Polygon, Arbitrum, etc.)
- Email/Discord notifications for significant changes
- Web dashboard for visualization
- Support for Uniswap V2 positions
- Automatic fee collection when threshold reached
- Integration with tax reporting tools

## Testing
To test the application:
1. Set up `.env` with valid wallet address
2. Run `npm run dev -- --once` for immediate test
3. Check `data/positions.json` for output
4. Check `data/positions.html` for HTML report
5. Verify calculations match Uniswap interface

## Dependencies
- **axios**: HTTP client for Graph API
- **node-cron**: Scheduling daily runs
- **dotenv**: Environment variable management
- **typescript/tsx**: TypeScript support

## Project Structure
```
uniswap-position-tracker/
├── src/
│   ├── index.ts           # Main entry point (class-based)
│   ├── uniswapClient.ts   # Graph API & calculations
│   ├── dataStorage.ts     # File persistence
│   ├── scheduler.ts       # Cron scheduling (timezone-aware)
│   ├── htmlGenerator.ts   # HTML report generation
│   ├── config/
│   │   ├── index.ts       # Config loading & validation
│   │   └── schema.ts      # Config TypeScript interfaces
│   ├── constants/
│   │   └── index.ts       # Centralized constants
│   ├── schemas/
│   │   └── index.ts       # GraphQL query builders
│   ├── types/
│   │   └── index.ts       # TypeScript interfaces
│   ├── utils/
│   │   └── index.ts       # Utility functions
│   └── services/          # Service modules (future)
├── data/                  # Output directory
│   ├── positions.json     # Historical position data
│   └── positions.html     # HTML report with tables
├── .env                   # Configuration
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

## Maintenance Notes
- The Graph endpoints may change; check https://thegraph.com for updates
- Uniswap V3 math is complex; be careful when modifying calculations
- Always test with small positions first
- Keep historical data backed up
- Math constants are centralized in `src/constants/index.ts`
- GraphQL queries can be modified in `src/schemas/index.ts`
- Configuration validation ensures either WALLET_ADDRESS or POSITION_ID is provided