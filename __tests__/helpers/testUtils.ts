import { GraphQLPosition } from '../../src/types';

/**
 * Helper function to create a mock GraphQL position for testing
 */
export function createMockPosition(overrides?: Partial<GraphQLPosition>): GraphQLPosition {
  const defaults: GraphQLPosition = {
    id: '123456',
    owner: '0x1234567890123456789012345678901234567890',
    liquidity: '1000000000000000000',
    tickLower: {
      tickIdx: '195180',
      feeGrowthOutside0X128: '0',
      feeGrowthOutside1X128: '0'
    },
    tickUpper: {
      tickIdx: '202020',
      feeGrowthOutside0X128: '0',
      feeGrowthOutside1X128: '0'
    },
    feeGrowthInside0LastX128: '0',
    feeGrowthInside1LastX128: '0',
    pool: {
      id: '0x11b815efb8f581194ae79006d24e0d814b7697f6',
      sqrtPrice: '4295128739000000000000000000',
      tick: '200000',
      token0Price: '0.0003333333333333333',
      token1Price: '3000',
      feeTier: '3000',
      liquidity: '1000000000000000000000000',
      feeGrowthGlobal0X128: '0',
      feeGrowthGlobal1X128: '0'
    },
    token0: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      symbol: 'WETH',
      decimals: '18',
      name: 'Wrapped Ether'
    },
    token1: {
      id: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      symbol: 'USDT',
      decimals: '6',
      name: 'Tether USD'
    },
    depositedToken0: '0',
    depositedToken1: '0',
    withdrawnToken0: '0',
    withdrawnToken1: '0',
    collectedFeesToken0: '0',
    collectedFeesToken1: '0'
  };

  return { ...defaults, ...overrides } as GraphQLPosition;
}

/**
 * Helper to compare BigInt values with tolerance
 */
export function expectBigIntCloseTo(
  actual: bigint,
  expected: bigint,
  tolerancePercent: number = 1
): void {
  const tolerance = (expected * BigInt(tolerancePercent)) / BigInt(100);
  const diff = actual > expected ? actual - expected : expected - actual;

  if (diff > tolerance) {
    throw new Error(
      `Expected ${actual} to be within ${tolerancePercent}% of ${expected}, but difference was ${diff}`
    );
  }
}

/**
 * Helper to compare number values with tolerance
 */
export function expectCloseTo(
  actual: number,
  expected: number,
  tolerancePercent: number = 1
): void {
  const tolerance = Math.abs(expected * tolerancePercent / 100);
  const diff = Math.abs(actual - expected);

  if (diff > tolerance) {
    throw new Error(
      `Expected ${actual} to be within ${tolerancePercent}% of ${expected}, but difference was ${diff}`
    );
  }
}

/**
 * Convert a price to sqrtPriceX96 format
 */
export function priceToSqrtPriceX96(price: number): bigint {
  const sqrtPrice = Math.sqrt(price);
  const q96 = BigInt(2) ** BigInt(96);
  return BigInt(Math.floor(sqrtPrice * Number(q96)));
}

/**
 * Convert sqrtPriceX96 to price
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
  const q96 = BigInt(2) ** BigInt(96);
  const sqrtPrice = Number(sqrtPriceX96) / Number(q96);
  return sqrtPrice * sqrtPrice;
}

/**
 * Calculate tick from price
 */
export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/**
 * Helper to format token amounts for comparison
 */
export function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Mock axios response for Graph API
 */
export function createMockGraphResponse(positions: GraphQLPosition[]) {
  return {
    data: {
      data: {
        positions
      }
    }
  };
}

/**
 * Create mock tick data for Arbitrum RPC calls
 */
export function createMockTickData(
  feeGrowthOutside0X128: string = '0',
  feeGrowthOutside1X128: string = '0'
) {
  // Encode tick data as it would be returned from eth_call
  const data = [
    BigInt(0), // liquidityGross
    BigInt(0), // liquidityNet
    BigInt(feeGrowthOutside0X128),
    BigInt(feeGrowthOutside1X128),
    BigInt(0), // tickCumulativeOutside
    BigInt(0), // secondsPerLiquidityOutsideX128
    BigInt(0), // secondsOutside
    true // initialized
  ];

  // Convert to hex string as RPC would return
  return '0x' + data.map(v => v.toString(16).padStart(64, '0')).join('');
}