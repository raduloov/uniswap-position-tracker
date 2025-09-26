import { getSqrtPriceX96FromTick } from "../../src/utils/index";

describe("getSqrtPriceX96FromTick", () => {
  describe("Basic functionality", () => {
    it("should return Q96 (2^96) for tick 0", () => {
      const result = getSqrtPriceX96FromTick(0);
      const expected = BigInt(2) ** BigInt(96);
      expect(result).toBe(expected);
    });

    it("should handle positive ticks correctly", () => {
      // Tick 1000 corresponds to price ratio of 1.0001^1000 ≈ 1.1052
      const result = getSqrtPriceX96FromTick(1000);
      // Should be greater than Q96 since positive tick means higher price
      const q96 = BigInt(2) ** BigInt(96);
      expect(result).toBeGreaterThan(q96);
      // Verify it's in expected range
      expect(result).toBeLessThan(q96 * BigInt(2)); // Less than 2x Q96
    });

    it("should handle negative ticks correctly", () => {
      // Tick -1000 corresponds to price ratio of 1.0001^-1000 ≈ 0.9048
      const result = getSqrtPriceX96FromTick(-1000);
      // Should be less than Q96 since negative tick means lower price
      const q96 = BigInt(2) ** BigInt(96);
      expect(result).toBeLessThan(q96);
      // But should still be positive
      expect(result).toBeGreaterThan(BigInt(0));
    });
  });

  describe("Edge cases", () => {
    it("should handle maximum tick (887272)", () => {
      const maxTick = 887272;
      const result = getSqrtPriceX96FromTick(maxTick);
      // Should return a very large number (max price)
      expect(result).toBeGreaterThan(BigInt(0));
      // Result should be within valid range
      expect(result.toString().length).toBeGreaterThan(30);
    });

    it("should handle minimum tick (-887272)", () => {
      const minTick = -887272;
      const result = getSqrtPriceX96FromTick(minTick);
      // Should return a very small number (min price)
      expect(result).toBeGreaterThan(BigInt(0));
      expect(result).toBeLessThan(BigInt(2) ** BigInt(96));
    });

    it("should handle tick 1", () => {
      const result = getSqrtPriceX96FromTick(1);
      // Should be slightly larger than Q96
      const q96 = BigInt(2) ** BigInt(96);
      expect(result).toBeGreaterThan(q96);
      // But not too much larger (within 0.01% = 1 basis point)
      const ratio = (result * BigInt(10000)) / q96;
      expect(ratio).toBeLessThan(BigInt(10001)); // Less than 1.0001 times Q96
    });

    it("should handle tick -1", () => {
      const result = getSqrtPriceX96FromTick(-1);
      // Should be slightly smaller than Q96
      const q96 = BigInt(2) ** BigInt(96);
      expect(result).toBeLessThan(q96);
      // But not too much smaller (within 0.01%)
      const ratio = (result * BigInt(10000)) / q96;
      expect(ratio).toBeGreaterThanOrEqual(BigInt(9999)); // Greater than or equal to 0.9999 times Q96
    });
  });

  describe("Known values from Uniswap V3", () => {
    it("should calculate reasonable values for common ticks", () => {
      // Test that values are in expected ranges
      const testCases = [
        { tick: 10000, minRatio: 2.5, maxRatio: 3.0, description: "Tick 10000" },
        { tick: -10000, minRatio: 0.3, maxRatio: 0.4, description: "Tick -10000" },
        { tick: 100000, minRatio: 20000, maxRatio: 25000, description: "Tick 100000" },
        { tick: -100000, minRatio: 0.000001, maxRatio: 0.0001, description: "Tick -100000" }
      ];

      const q96 = Number(BigInt(2) ** BigInt(96));

      testCases.forEach(({ tick, minRatio, maxRatio }) => {
        const result = getSqrtPriceX96FromTick(tick);
        const ratio = Number(result) / q96;

        // sqrt price should be between sqrt(minRatio) and sqrt(maxRatio)
        expect(ratio).toBeGreaterThan(Math.sqrt(minRatio));
        expect(ratio).toBeLessThan(Math.sqrt(maxRatio));
      });
    });

    it("should calculate values for typical WETH/USDT range", () => {
      // These are actual ticks used in WETH/USDT positions
      const lowerTick = 195180;
      const upperTick = 202020;

      const lowerResult = getSqrtPriceX96FromTick(lowerTick);
      const upperResult = getSqrtPriceX96FromTick(upperTick);

      // Upper should be greater than lower
      expect(upperResult).toBeGreaterThan(lowerResult);

      // Both should be reasonable values
      expect(lowerResult).toBeGreaterThan(BigInt(0));
      expect(upperResult).toBeGreaterThan(BigInt(0));
    });
  });

  describe("Consistency checks", () => {
    it("should increase monotonically with tick", () => {
      const ticks = [-1000, -500, 0, 500, 1000, 5000, 10000];
      const results = ticks.map(tick => getSqrtPriceX96FromTick(tick));

      for (let i = 1; i < results.length; i++) {
        expect(results[i]!).toBeGreaterThan(results[i - 1]!);
      }
    });

    it("should be approximately inverse for opposite ticks", () => {
      const tick = 5000;
      const positiveResult = getSqrtPriceX96FromTick(tick);
      const negativeResult = getSqrtPriceX96FromTick(-tick);

      // The product should be close to Q96^2
      const q96Squared = (BigInt(2) ** BigInt(96)) ** BigInt(2);
      const product = positiveResult * negativeResult;

      // Calculate difference in basis points
      const diff = product > q96Squared ? product - q96Squared : q96Squared - product;
      const percentDiff = (diff * BigInt(10000)) / q96Squared;

      // Should be within 1% due to rounding
      expect(percentDiff).toBeLessThan(BigInt(100));
    });

    it("should handle all bit positions correctly", () => {
      // Test ticks that activate different bit positions
      const bitPositions = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];

      bitPositions.forEach(tick => {
        const result = getSqrtPriceX96FromTick(tick);
        expect(result).toBeGreaterThan(BigInt(0));
        expect(result.toString()).toMatch(/^\d+$/); // Should be a valid number string
      });
    });
  });

  describe("Mathematical properties", () => {
    it("should calculate price correctly from sqrtPriceX96", () => {
      const tick = 10000;
      const sqrtPriceX96 = getSqrtPriceX96FromTick(tick);

      // Convert to actual price: (sqrtPriceX96 / 2^96)^2
      const q96 = BigInt(2) ** BigInt(96);
      const price = Number(sqrtPriceX96) / Number(q96);
      const actualPrice = price * price;

      // Expected price from tick: 1.0001^10000
      const expectedPrice = Math.pow(1.0001, 10000);

      // Should be within 0.1% of expected
      const percentDiff = Math.abs(actualPrice - expectedPrice) / expectedPrice;
      expect(percentDiff).toBeLessThan(0.001);
    });

    it("should handle tick spacing correctly", () => {
      // The function uses bit manipulation to handle different tick spacings
      // Verify that the HEX_VALUES are used correctly
      const tick = 0x1 | 0x2 | 0x4; // Tick with multiple bits set (7)
      const result = getSqrtPriceX96FromTick(tick);

      // Should produce a valid result
      expect(result).toBeGreaterThan(BigInt(0));

      // Should be greater than tick 6 but less than tick 8
      const result6 = getSqrtPriceX96FromTick(6);
      const result8 = getSqrtPriceX96FromTick(8);
      expect(result).toBeGreaterThan(result6);
      expect(result).toBeLessThan(result8);
    });
  });
});
