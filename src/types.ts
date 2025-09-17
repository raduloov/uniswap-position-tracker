export interface PositionData {
  timestamp: string;
  date: string;
  positionId: string;
  owner: string;
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