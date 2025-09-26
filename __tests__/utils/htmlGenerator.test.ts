import {
  calculateFeeDifference,
  calculateTotalValueDifference,
  calculatePriceDifference,
  formatFeeDifference,
  formatTotalValueWithChange,
  formatPriceWithChange,
  isPositionInRange,
  formatStatusBadge,
  calculatePositionAge,
  formatTableDate,
  calculateAverageDailyFees,
  calculateProfitLoss
} from '../../src/utils/htmlGenerator';
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

describe('htmlGenerator utility re-exports', () => {
  describe('calculateFeeDifference', () => {
    it('should work correctly as re-export', () => {
      const current = createMockPosition({
        uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 20 }
      });
      const previous = createMockPosition({
        uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 15 }
      });
      expect(calculateFeeDifference(current, previous)).toBe(5);
    });
  });

  describe('calculateTotalValueDifference', () => {
    it('should rename properties correctly', () => {
      const result = calculateTotalValueDifference(1500, 1000);
      expect(result).toEqual({ difference: 500, percentageChange: 50 });
    });

    it('should handle null case', () => {
      const result = calculateTotalValueDifference(undefined, 1000);
      expect(result).toBe(null);
    });
  });

  describe('calculatePriceDifference', () => {
    it('should rename properties correctly', () => {
      const result = calculatePriceDifference(110, 100);
      expect(result).toEqual({ difference: 10, percentageChange: 10 });
    });

    it('should handle null case', () => {
      const result = calculatePriceDifference(100, undefined);
      expect(result).toBe(null);
    });
  });

  describe('formatFeeDifference', () => {
    it('should format positive fee difference', () => {
      const result = formatFeeDifference(123.45);
      expect(result).toContain('fees-24h');
      expect(result).toContain('+$123.45');
    });

    it('should handle null', () => {
      const result = formatFeeDifference(null);
      expect(result).toContain('#718096');
    });
  });

  describe('formatTotalValueWithChange', () => {
    it('should format value with change', () => {
      const result = formatTotalValueWithChange(1000, 5.5);
      expect(result).toContain('<strong>$1,000.00</strong>');
      expect(result).toContain('+5.50%');
    });
  });

  describe('formatPriceWithChange', () => {
    it('should format price with change', () => {
      const result = formatPriceWithChange(3450.23, 2.45);
      expect(result).toContain('$3,450.23');
      expect(result).toContain('+2.45%');
    });

    it('should handle undefined price', () => {
      const result = formatPriceWithChange(undefined, 5);
      expect(result).toBe('N/A');
    });
  });

  describe('isPositionInRange', () => {
    it('should detect in-range position', () => {
      const position = createMockPosition({
        priceRange: { lower: 3000, upper: 4000, current: 3500, currency: 'USDT' }
      });
      expect(isPositionInRange(position)).toBe(true);
    });

    it('should detect out-of-range position', () => {
      const position = createMockPosition({
        priceRange: { lower: 3000, upper: 4000, current: 4500, currency: 'USDT' }
      });
      expect(isPositionInRange(position)).toBe(false);
    });
  });

  describe('formatStatusBadge', () => {
    it('should format in-range badge', () => {
      const result = formatStatusBadge(true);
      expect(result).toContain('status-in-range');
      expect(result).toContain('In Range');
    });

    it('should format out-of-range badge', () => {
      const result = formatStatusBadge(false);
      expect(result).toContain('status-out-range');
      expect(result).toContain('Out of Range');
    });
  });

  describe('calculatePositionAge', () => {
    it('should calculate age correctly', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const result = calculatePositionAge(tenDaysAgo.toISOString());
      expect(result.days).toBe(10);
      expect(result.text).toBe('10 days old');
    });
  });

  describe('formatTableDate', () => {
    it('should format date correctly', () => {
      const timestamp = '2024-01-15T14:30:00Z';
      const result = formatTableDate(timestamp, 'UTC');
      expect(result).toMatch(/^MON, JAN 15, 14:30$/);
    });
  });

  describe('calculateAverageDailyFees', () => {
    it('should calculate average correctly', () => {
      const positions = [
        createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 30 } }),
        createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 20 } }),
        createMockPosition({ uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 10 } })
      ];
      // Fee differences: (30-20)=10, (20-10)=10
      // Average = 20/2 = 10
      const result = calculateAverageDailyFees(positions);
      expect(result).toBe(10);
    });
  });

  describe('calculateProfitLoss', () => {
    it('should calculate profit correctly', () => {
      const positions = [
        createMockPosition({ totalValueUSD: 3000, uncollectedFees: { token0: '10', token1: '0.001', token0USD: 10, token1USD: 3.5, totalUSD: 50 } }),
        createMockPosition({ totalValueUSD: 2500 })
      ];
      const result = calculateProfitLoss(positions);
      // P/L = (3000 - 2500) + 50 = 550
      // Percentage = 550 / 2500 * 100 = 22%
      expect(result.value).toBe(550);
      expect(result.percentage).toBe(22);
    });

    it('should handle empty array', () => {
      const result = calculateProfitLoss([]);
      expect(result).toEqual({ value: 0, percentage: 0 });
    });
  });
});