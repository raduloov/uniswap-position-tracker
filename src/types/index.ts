export interface GraphQLPosition {
  id: string;
  owner: string;
  liquidity: string;
  tickLower:
    | string
    | {
        tickIdx: string;
        feeGrowthOutside0X128: string;
        feeGrowthOutside1X128: string;
      };
  tickUpper:
    | string
    | {
        tickIdx: string;
        feeGrowthOutside0X128: string;
        feeGrowthOutside1X128: string;
      };
  token0: {
    id: string;
    symbol: string;
    decimals: string;
    name: string;
  };
  token1: {
    id: string;
    symbol: string;
    decimals: string;
    name: string;
  };
  pool: {
    id: string;
    feeTier: string;
    sqrtPrice: string;
    tick: string;
    token0Price: string;
    token1Price: string;
    liquidity: string;
    feeGrowthGlobal0X128: string;
    feeGrowthGlobal1X128: string;
  };
  depositedToken0: string;
  depositedToken1: string;
  withdrawnToken0: string;
  withdrawnToken1: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
  feeGrowthInside0LastX128: string;
  feeGrowthInside1LastX128: string;
}

export enum Chain {
  ETHEREUM = "ethereum",
  ARBITRUM = "arbitrum"
}

export interface PositionData {
  timestamp: string;
  date: string;
  positionId: string;
  owner: string;
  chain: Chain;
  token0: {
    symbol: string;
    address: string;
    amount: string;
    valueUSD?: number;
  };
  token1: {
    symbol: string;
    address: string;
    amount: string;
    valueUSD?: number;
  };
  liquidity: string;
  tickLower: number;
  tickUpper: number;
  fee: number;
  uncollectedFees: {
    token0: string;
    token1: string;
    token0USD?: number;
    token1USD?: number;
    totalUSD?: number;
  };
  totalValueUSD?: number;
  pool: {
    address: string;
    currentTick: number;
    sqrtPriceX96: string;
  };
  priceRange?: {
    lower: number;
    upper: number;
    current: number;
    currency: string;
  };
}

export enum PositionDataSource {
  SUPABASE = "supabase",
  LOCAL = "local",
  NONE = "none"
}

export interface PositionDataResult {
  allPositions: PositionData[];
  latestPositions: PositionData[];
  previousPositions: PositionData[];
  timestamps: string[];
  source: PositionDataSource;
}

export interface PositionMetrics {
  positionId: string;
  chain: string;
  poolName: string;
  feeTier: number;
  inRange: boolean;
  currentValue: number;
  currentFees: number;
  totalPnL: number;
  totalPnLPercentage: number;
  value24hChange: number;
  value24hChangePercentage: number;
  fees24hChange: number;
  averageDailyFees: number;
  positionAge: { days: number; text: string };
  priceRange: {
    lower: number;
    upper: number;
    current: number;
  } | null;
  currentPrice: number | null;
  price24hChange: number | null;
  price24hChangePercentage: number | null;
}

export interface DashboardMetrics {
  totalPnL: number;
  totalFees: number;
  fees24h: number;
  currentEthPrice: number;
  totalValue: number;
  totalFeesChange: number;
  totalValueChange: number;
  ethPriceChange: number;
  totalPnLChange: number;
}

export interface PortfolioMetrics {
  dashboard: DashboardMetrics;
  totalValueUSD: number;
  totalFeesUSD: number;
  totalPnL: number;
  totalPnLPercentage: number;
  total24hFees: number;
  inRangeCount: number;
  outOfRangeCount: number;
  currentEthPrice: number | null;
  ethPrice24hChange: number | null;
  ethPrice24hChangePercentage: number | null;
  positions: PositionMetrics[];
}

export enum TrackingType {
  DAILY = "daily",
  HOURLY = "hourly"
}
