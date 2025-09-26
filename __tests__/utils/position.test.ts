import {
  isPositionInRange,
  calculateFeeDifference,
  calculate24hFees,
  calculateValueChange,
  calculatePriceChange,
  calculateProfitLoss,
  calculateAverageDailyFees,
  calculatePositionAge,
  formatFeeTier
} from '../../src/utils/position';
import { PositionData, Chain } from '../../src/types';

// Helper function to create mock position
const createMockPosition = (overrides?: Partial<PositionData>): PositionData => ({
  chain: Chain.ETHEREUM,
  positionId: '123',
  owner: '0xowner',
  token0: {
    symbol: 'USDC',
    address: '0xusdc',
    amount: '1000',
    valueUSD: 1000
  },
  token1: {
    symbol: 'WETH',
    address: '0xweth',
    amount: '0.5',
    valueUSD: 1750
  },
  totalValueUSD: 2750,
  liquidity: '1000000',
  tickLower: -887220,
  tickUpper: 887220,
  fee: 3000,
  uncollectedFees: {
    token0: '10',
    token1: '0.001',
    token0USD: 10,
    token1USD: 3.5,
    totalUSD: 13.5
  },
  pool: {
    address: '0xpool',
    currentTick: 0,
    sqrtPriceX96: '1000000000000000000000000'
  },
  priceRange: {
    lower: 3000,
    upper: 4000,
    current: 3500,
    currency: 'USDT'
  },
  timestamp: '2024-01-15T12:00:00Z',
  date: '2024-01-15',
  ...overrides
});

describe('isPositionInRange', () => {
  it('should detect in-range position using priceRange', () => {
    const position = createMockPosition({
      priceRange: { lower: 3000, upper: 4000, current: 3500, currency: 'USDT' }
    });
    expect(isPositionInRange(position)).toBe(true);
  });

  it('should detect out-of-range position using priceRange', () => {
    const position = createMockPosition({
      priceRange: { lower: 3000, upper: 4000, current: 4500, currency: 'USDT' }
    });
    expect(isPositionInRange(position)).toBe(false);
  });

  it('should detect in-range position using ticks', () => {
    const position = {
      ...createMockPosition(),
      priceRange: undefined,
      tickLower: -100,
      tickUpper: 100,
      pool: { address: '0xpool', currentTick: 0, sqrtPriceX96: '1' }
    } as unknown as PositionData;
    expect(isPositionInRange(position)).toBe(true);
  });

  it('should detect out-of-range position using ticks', () => {
    const position = {
      ...createMockPosition(),
      priceRange: undefined,
      tickLower: -100,
      tickUpper: 100,
      pool: { address: '0xpool', currentTick: 200, sqrtPriceX96: '1' }
    } as unknown as PositionData;
    expect(isPositionInRange(position)).toBe(false);
  });

  it('should return false when no range data available', () => {
    const position = {
      ...createMockPosition(),
      priceRange: undefined,
      pool: undefined
    } as unknown as PositionData;
    expect(isPositionInRange(position)).toBe(false);
  });
});

describe('calculateFeeDifference', () => {
  it('should calculate positive fee difference', () => {
    const current = createMockPosition({
      uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 20 }
    });
    const previous = createMockPosition({
      uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 15 }
    });
    expect(calculateFeeDifference(current, previous)).toBe(5);
  });

  it('should calculate negative fee difference', () => {
    const current = createMockPosition({
      uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 10 }
    });
    const previous = createMockPosition({
      uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 15 }
    });
    expect(calculateFeeDifference(current, previous)).toBe(-5);
  });

  it('should return null when no previous position', () => {
    const current = createMockPosition();
    expect(calculateFeeDifference(current, null)).toBe(null);
  });

  it('should handle missing fee data', () => {
    const current = { ...createMockPosition(), uncollectedFees: undefined } as unknown as PositionData;
    const previous = { ...createMockPosition(), uncollectedFees: undefined } as unknown as PositionData;
    expect(calculateFeeDifference(current, previous)).toBe(0);
  });
});

describe('calculate24hFees', () => {
  it('should calculate total 24h fees', () => {
    const current = [
      createMockPosition({ positionId: '1', uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 20 } }),
      createMockPosition({ positionId: '2', uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 30 } })
    ];
    const previous = [
      createMockPosition({ positionId: '1', uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 15 } }),
      createMockPosition({ positionId: '2', uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 25 } })
    ];
    expect(calculate24hFees(current, previous)).toBe(10); // (20-15) + (30-25)
  });

  it('should handle missing previous positions', () => {
    const current = [createMockPosition()];
    expect(calculate24hFees(current, undefined)).toBe(0);
  });

  it('should handle new positions', () => {
    const current = [
      createMockPosition({ positionId: '1', uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 20 } }),
      createMockPosition({ positionId: '2', uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 30 } })
    ];
    const previous = [
      createMockPosition({ positionId: '1', uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 15 } })
    ];
    expect(calculate24hFees(current, previous)).toBe(5); // Only position 1: (20-15)
  });
});

describe('calculateValueChange', () => {
  it('should calculate positive value change', () => {
    const result = calculateValueChange(1500, 1000);
    expect(result).toEqual({ difference: 500, percentage: 50 });
  });

  it('should calculate negative value change', () => {
    const result = calculateValueChange(800, 1000);
    expect(result).toEqual({ difference: -200, percentage: -20 });
  });

  it('should return null for undefined values', () => {
    expect(calculateValueChange(undefined, 1000)).toBe(null);
    expect(calculateValueChange(1000, undefined)).toBe(null);
  });

  it('should return null for zero previous value', () => {
    expect(calculateValueChange(1000, 0)).toBe(null);
  });
});

describe('calculatePriceChange', () => {
  it('should calculate positive price change', () => {
    const result = calculatePriceChange(3600, 3500);
    expect(result.difference).toBe(100);
    expect(result.percentage).toBeCloseTo(2.857, 2);
    expect(result.emoji).toBe('📈');
    expect(result.formatted).toContain('+');
  });

  it('should calculate negative price change', () => {
    const result = calculatePriceChange(3400, 3500);
    expect(result.difference).toBe(-100);
    expect(result.percentage).toBeCloseTo(-2.857, 2);
    expect(result.emoji).toBe('📉');
    expect(result.formatted).toContain('-');
  });

  it('should handle zero previous price', () => {
    const result = calculatePriceChange(3500, 0);
    expect(result.percentage).toBe(0);
  });
});

describe('calculateProfitLoss', () => {
  it('should calculate profit', () => {
    const positions = [
      createMockPosition({ totalValueUSD: 3000, uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 50 } }),
      createMockPosition({ totalValueUSD: 2800 }),
      createMockPosition({ totalValueUSD: 2500 })
    ];
    const result = calculateProfitLoss(positions);
    // P/L = (3000 - 2500) + 50 = 550
    // Percentage = 550 / 2500 * 100 = 22%
    expect(result.value).toBe(550);
    expect(result.percentage).toBe(22);
  });

  it('should calculate loss', () => {
    const positions = [
      createMockPosition({ totalValueUSD: 2000, uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 10 } }),
      createMockPosition({ totalValueUSD: 2500 })
    ];
    const result = calculateProfitLoss(positions);
    // P/L = (2000 - 2500) + 10 = -490
    // Percentage = -490 / 2500 * 100 = -19.6%
    expect(result.value).toBe(-490);
    expect(result.percentage).toBe(-19.6);
  });

  it('should handle empty positions array', () => {
    const result = calculateProfitLoss([]);
    expect(result).toEqual({ value: 0, percentage: 0 });
  });

  it('should handle single position', () => {
    const positions = [createMockPosition({ totalValueUSD: 3000, uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 50 } })];
    const result = calculateProfitLoss(positions);
    // P/L = (3000 - 3000) + 50 = 50
    // Percentage = 50 / 3000 * 100 = 1.667%
    expect(result.value).toBe(50);
    expect(result.percentage).toBeCloseTo(1.667, 2);
  });
});

describe('calculateAverageDailyFees', () => {
  it('should calculate average daily fees', () => {
    const positions = [
      createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 30 } }),
      createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 25 } }),
      createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 20 } }),
      createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 10 } })
    ];
    // Fee differences: (30-25)=5, (25-20)=5, (20-10)=10
    // Average = 20/3 = 6.667
    const result = calculateAverageDailyFees(positions);
    expect(result).toBeCloseTo(6.667, 2);
  });

  it('should handle single position', () => {
    const positions = [createMockPosition()];
    expect(calculateAverageDailyFees(positions)).toBe(0);
  });

  it('should ignore negative fee differences', () => {
    const positions = [
      createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 10 } }),
      createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 20 } }),
      createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 15 } })
    ];
    // Fee differences: (10-20)=-10 (ignored), (20-15)=5
    // Average = 5/1 = 5
    const result = calculateAverageDailyFees(positions);
    expect(result).toBe(5);
  });
});

describe('calculatePositionAge', () => {
  it('should calculate position age in days', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const result = calculatePositionAge(tenDaysAgo.toISOString());
    expect(result.days).toBe(10);
    expect(result.text).toBe('10 days old');
  });

  it('should handle new position (today)', () => {
    const today = new Date();
    const result = calculatePositionAge(today.toISOString());
    expect(result.days).toBe(0);
    expect(result.text).toBe('New position');
  });

  it('should handle 1 day old position', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = calculatePositionAge(yesterday.toISOString());
    expect(result.days).toBe(1);
    expect(result.text).toBe('1 day old');
  });
});

describe('formatFeeTier', () => {
  it('should format fee tier correctly', () => {
    expect(formatFeeTier(3000)).toBe(0.3);
    expect(formatFeeTier(500)).toBe(0.05);
    expect(formatFeeTier(10000)).toBe(1);
    expect(formatFeeTier(100)).toBe(0.01);
  });
});