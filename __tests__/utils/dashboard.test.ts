import { calculateDashboardMetrics } from "../../src/utils/dashboard";
import { PositionData, Chain } from "../../src/types";

describe("Dashboard Utilities", () => {
  // Helper function to create a mock position
  const createMockPosition = (overrides: Partial<PositionData> = {}): PositionData => ({
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    positionId: "123456",
    owner: "0x123",
    chain: Chain.ETHEREUM,
    token0: {
      symbol: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      amount: "1.5",
      valueUSD: 4500
    },
    token1: {
      symbol: "USDT",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      amount: "4500",
      valueUSD: 4500
    },
    liquidity: "1000000000000000",
    tickLower: 195000,
    tickUpper: 205000,
    fee: 3000,
    uncollectedFees: {
      token0: "0.01",
      token1: "30",
      token0USD: 30,
      token1USD: 30,
      totalUSD: 60
    },
    totalValueUSD: 9000,
    pool: {
      address: "0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36",
      currentTick: 200000,
      sqrtPriceX96: "5897000000000000000000000"
    },
    priceRange: {
      lower: 2800,
      upper: 3200,
      current: 3000,
      currency: "USDT"
    },
    ...overrides
  });

  describe("calculateDashboardMetrics", () => {
    it("should return zero metrics for empty position groups", () => {
      const positionGroups = new Map<string, PositionData[]>();
      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics).toEqual({
        totalPnL: 0,
        totalFees: 0,
        fees24h: 0,
        currentEthPrice: 0,
        totalValue: 0,
        totalFeesChange: 0,
        totalValueChange: 0,
        ethPriceChange: 0,
        totalPnLChange: 0
      });
    });

    it("should calculate metrics for a single position with no history", () => {
      const position = createMockPosition();
      const positionGroups = new Map([["123456", [position]]]);

      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.totalFees).toBe(60); // From uncollectedFees.totalUSD
      expect(metrics.totalValue).toBe(9000); // From totalValueUSD
      expect(metrics.fees24h).toBe(60); // currentFees - 0 = 60
      expect(metrics.currentEthPrice).toBe(3000); // From priceRange.current
      expect(metrics.totalPnL).toBe(60); // Current fees with no value change (9000-9000)+60
      expect(metrics.totalFeesChange).toBe(0); // No previous position
      expect(metrics.totalValueChange).toBe(0); // (9000 - 9000) / 9000 * 100 = 0
      expect(metrics.ethPriceChange).toBe(0); // No previous price
      expect(metrics.totalPnLChange).toBeCloseTo(0.67, 2); // 60 / 9000 * 100
    });

    it("should calculate metrics with position history", () => {
      const currentPosition = createMockPosition({
        totalValueUSD: 10000,
        uncollectedFees: {
          token0: "0.02",
          token1: "60",
          token0USD: 60,
          token1USD: 60,
          totalUSD: 120
        },
        priceRange: {
          lower: 2800,
          upper: 3200,
          current: 3100,
          currency: "USDT"
        }
      });

      const previousPosition = createMockPosition({
        totalValueUSD: 9500,
        uncollectedFees: {
          token0: "0.01",
          token1: "30",
          token0USD: 30,
          token1USD: 30,
          totalUSD: 60
        },
        priceRange: {
          lower: 2800,
          upper: 3200,
          current: 3000,
          currency: "USDT"
        }
      });

      const oldestPosition = createMockPosition({
        totalValueUSD: 9000,
        uncollectedFees: {
          token0: "0",
          token1: "0",
          token0USD: 0,
          token1USD: 0,
          totalUSD: 0
        }
      });

      const positionGroups = new Map([["123456", [currentPosition, previousPosition, oldestPosition]]]);

      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.totalFees).toBe(120);
      expect(metrics.totalValue).toBe(10000);
      expect(metrics.fees24h).toBe(60); // 120 - 60
      expect(metrics.currentEthPrice).toBe(3100);
      expect(metrics.totalPnL).toBe(1120); // (10000 - 9000) + 120
      expect(metrics.totalFeesChange).toBe(100); // (120 - 60) / 60 * 100
      expect(metrics.totalValueChange).toBeCloseTo(11.11, 2); // (10000 - 9000) / 9000 * 100
      expect(metrics.ethPriceChange).toBeCloseTo(3.33, 2); // (3100 - 3000) / 3000 * 100
      expect(metrics.totalPnLChange).toBeCloseTo(12.44, 2); // 1120 / 9000 * 100
    });

    it("should handle multiple position groups", () => {
      const position1Current = createMockPosition({
        positionId: "111",
        totalValueUSD: 5000,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 50 }
      });

      const position1Previous = createMockPosition({
        positionId: "111",
        totalValueUSD: 4800,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 30 }
      });

      const position2Current = createMockPosition({
        positionId: "222",
        totalValueUSD: 7000,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 80 }
      });

      const position2Previous = createMockPosition({
        positionId: "222",
        totalValueUSD: 6800,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 60 }
      });

      const positionGroups = new Map([
        ["111", [position1Current, position1Previous]],
        ["222", [position2Current, position2Previous]]
      ]);

      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.totalFees).toBe(130); // 50 + 80
      expect(metrics.totalValue).toBe(12000); // 5000 + 7000
      expect(metrics.fees24h).toBe(40); // (50 - 30) + (80 - 60)
      expect(metrics.totalFeesChange).toBeCloseTo(44.44, 2); // (130 - 90) / 90 * 100
    });

    it("should identify ETH pools correctly", () => {
      const ethPosition = createMockPosition({
        token0: { symbol: "WETH", address: "0x123", amount: "1", valueUSD: 3000 },
        token1: { symbol: "USDT", address: "0x456", amount: "3000", valueUSD: 3000 },
        priceRange: { lower: 2800, upper: 3200, current: 3000, currency: "USDT" }
      });

      const nonEthPosition = createMockPosition({
        token0: { symbol: "LINK", address: "0x789", amount: "100", valueUSD: 1000 },
        token1: { symbol: "USDC", address: "0xabc", amount: "1000", valueUSD: 1000 },
        priceRange: { lower: 9, upper: 11, current: 10, currency: "USDC" }
      });

      const positionGroups = new Map([
        ["eth", [ethPosition]],
        ["link", [nonEthPosition]]
      ]);

      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.currentEthPrice).toBe(3000); // Should pick ETH price
    });

    it("should handle positions without price ranges", () => {
      const position = createMockPosition({
        priceRange: undefined as any
      });

      const positionGroups = new Map([["123", [position]]]);
      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.currentEthPrice).toBe(0);
      expect(metrics.ethPriceChange).toBe(0);
    });

    it("should handle positions with zero initial value", () => {
      const currentPosition = createMockPosition({
        totalValueUSD: 1000,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 50 }
      });

      const oldestPosition = createMockPosition({
        totalValueUSD: 0,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 0 }
      });

      const positionGroups = new Map([["123", [currentPosition, oldestPosition]]]);
      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.totalPnLChange).toBe(0); // Should not divide by zero
      expect(metrics.totalValueChange).toBe(0); // Should not divide by zero
    });

    it("should handle missing uncollected fees", () => {
      const position = createMockPosition({
        uncollectedFees: undefined as any
      });

      const positionGroups = new Map([["123", [position]]]);
      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.totalFees).toBe(0);
      expect(metrics.fees24h).toBe(0);
    });

    it("should calculate P&L correctly with multiple positions", () => {
      const position1Current = createMockPosition({
        positionId: "111",
        totalValueUSD: 5500,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 100 }
      });

      const position1Oldest = createMockPosition({
        positionId: "111",
        totalValueUSD: 5000,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 0 }
      });

      const position2Current = createMockPosition({
        positionId: "222",
        totalValueUSD: 7700,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 150 }
      });

      const position2Oldest = createMockPosition({
        positionId: "222",
        totalValueUSD: 7000,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 0 }
      });

      const positionGroups = new Map([
        ["111", [position1Current, position1Oldest]],
        ["222", [position2Current, position2Oldest]]
      ]);

      const metrics = calculateDashboardMetrics(positionGroups);

      // P&L = (5500 - 5000) + 100 + (7700 - 7000) + 150 = 500 + 100 + 700 + 150 = 1450
      expect(metrics.totalPnL).toBe(1450);

      // P&L % = 1450 / (5000 + 7000) * 100 = 1450 / 12000 * 100 ≈ 12.08%
      expect(metrics.totalPnLChange).toBeCloseTo(12.08, 2);
    });

    it("should handle Arbitrum positions", () => {
      const arbPosition = createMockPosition({
        chain: Chain.ARBITRUM,
        token0: { symbol: "WETH", address: "0x123", amount: "1", valueUSD: 3000 },
        token1: { symbol: "USDC", address: "0x456", amount: "3000", valueUSD: 3000 },
        priceRange: { lower: 2800, upper: 3200, current: 3050, currency: "USDC" }
      });

      const positionGroups = new Map([["arb123", [arbPosition]]]);
      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.currentEthPrice).toBe(3050);
      expect(metrics.totalValue).toBe(9000);
    });

    it("should prioritize first found ETH pool for price", () => {
      const ethPosition1 = createMockPosition({
        positionId: "111",
        priceRange: { lower: 2800, upper: 3200, current: 3000, currency: "USDT" }
      });

      const ethPosition2 = createMockPosition({
        positionId: "222",
        priceRange: { lower: 2900, upper: 3300, current: 3100, currency: "USDC" }
      });

      const positionGroups = new Map([
        ["111", [ethPosition1]],
        ["222", [ethPosition2]]
      ]);

      const metrics = calculateDashboardMetrics(positionGroups);

      // Should use the first ETH position's price
      expect(metrics.currentEthPrice).toBe(3000);
    });

    it("should handle empty position arrays in groups", () => {
      const positionGroups = new Map([
        ["empty", []],
        ["valid", [createMockPosition()]]
      ]);

      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.totalValue).toBe(9000); // Only from valid position
      expect(metrics.totalFees).toBe(60); // Only from valid position
    });

    it("should handle percentage calculations with zero previous values", () => {
      const currentPosition = createMockPosition({
        totalValueUSD: 1000,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 50 },
        priceRange: { lower: 2800, upper: 3200, current: 3000, currency: "USDT" }
      });

      const previousPosition = createMockPosition({
        totalValueUSD: 0,
        uncollectedFees: { token0: "0", token1: "0", totalUSD: 0 },
        priceRange: { lower: 2800, upper: 3200, current: 0, currency: "USDT" }
      });

      const positionGroups = new Map([["123", [currentPosition, previousPosition]]]);
      const metrics = calculateDashboardMetrics(positionGroups);

      expect(metrics.totalFeesChange).toBe(0); // Previous fees were 0
      expect(metrics.ethPriceChange).toBe(0); // Previous price was 0
    });
  });
});
