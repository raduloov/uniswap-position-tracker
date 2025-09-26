import { getAmountsForLiquidity, getAmount0ForLiquidity, getAmount1ForLiquidity } from "../../src/utils/liquidity";
import { getSqrtPriceX96FromTick } from "../../src/utils/index";

describe("Liquidity Calculations", () => {
  const Q96 = BigInt(2) ** BigInt(96);

  describe("getAmount0ForLiquidity", () => {
    it("should calculate amount0 correctly for basic case", () => {
      const sqrtPriceLowerX96 = Q96; // price = 1
      const sqrtPriceUpperX96 = Q96 * BigInt(2); // price = 4
      const liquidity = BigInt(1000000);

      const amount0 = getAmount0ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);

      expect(amount0).toBeGreaterThan(BigInt(0));
      expect(amount0.toString()).toMatch(/^\d+$/);
    });

    it("should handle swapped price inputs correctly", () => {
      const sqrtPriceLowerX96 = Q96;
      const sqrtPriceUpperX96 = Q96 * BigInt(2);
      const liquidity = BigInt(1000000);

      const amount1 = getAmount0ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
      const amount2 = getAmount0ForLiquidity(sqrtPriceUpperX96, sqrtPriceLowerX96, liquidity);

      expect(amount1).toBe(amount2);
    });

    it("should return 0 when liquidity is 0", () => {
      const sqrtPriceLowerX96 = Q96;
      const sqrtPriceUpperX96 = Q96 * BigInt(2);
      const liquidity = BigInt(0);

      const amount0 = getAmount0ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);

      expect(amount0).toBe(BigInt(0));
    });

    it("should handle very large liquidity values", () => {
      const sqrtPriceLowerX96 = Q96;
      const sqrtPriceUpperX96 = Q96 * BigInt(11) / BigInt(10); // 10% range
      const liquidity = BigInt("1000000000000000000000"); // Large liquidity

      const amount0 = getAmount0ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);

      expect(amount0).toBeGreaterThan(BigInt(0));
      expect(() => amount0.toString()).not.toThrow();
    });

    it("should handle same price bounds (zero range)", () => {
      const sqrtPriceX96 = Q96;
      const liquidity = BigInt(1000000);

      const amount0 = getAmount0ForLiquidity(sqrtPriceX96, sqrtPriceX96, liquidity);

      expect(amount0).toBe(BigInt(0));
    });
  });

  describe("getAmount1ForLiquidity", () => {
    it("should calculate amount1 correctly for basic case", () => {
      const sqrtPriceLowerX96 = Q96;
      const sqrtPriceUpperX96 = Q96 * BigInt(2);
      const liquidity = BigInt(1000000);

      const amount1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);

      expect(amount1).toBeGreaterThan(BigInt(0));
      expect(amount1.toString()).toMatch(/^\d+$/);
    });

    it("should handle swapped price inputs correctly", () => {
      const sqrtPriceLowerX96 = Q96;
      const sqrtPriceUpperX96 = Q96 * BigInt(2);
      const liquidity = BigInt(1000000);

      const amount1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
      const amount2 = getAmount1ForLiquidity(sqrtPriceUpperX96, sqrtPriceLowerX96, liquidity);

      expect(amount1).toBe(amount2);
    });

    it("should return 0 when liquidity is 0", () => {
      const sqrtPriceLowerX96 = Q96;
      const sqrtPriceUpperX96 = Q96 * BigInt(2);
      const liquidity = BigInt(0);

      const amount1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);

      expect(amount1).toBe(BigInt(0));
    });

    it("should be proportional to liquidity", () => {
      const sqrtPriceLowerX96 = Q96;
      const sqrtPriceUpperX96 = Q96 * BigInt(2);
      const liquidity1 = BigInt(1000000);
      const liquidity2 = BigInt(2000000);

      const amount1_1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity1);
      const amount1_2 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity2);

      expect(amount1_2).toBe(amount1_1 * BigInt(2));
    });
  });

  describe("getAmountsForLiquidity", () => {
    describe("Position in range", () => {
      it("should calculate both token amounts when price is in range", () => {
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 200000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("1000000000000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        expect(amount0).toBeGreaterThan(BigInt(0));
        expect(amount1).toBeGreaterThan(BigInt(0));
      });

      it("should have more token0 when price is closer to lower bound", () => {
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickNearLower = 196000;
        const tickNearUpper = 204000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceNearLowerX96 = getSqrtPriceX96FromTick(tickNearLower);
        const sqrtPriceNearUpperX96 = getSqrtPriceX96FromTick(tickNearUpper);
        const liquidity = BigInt("1000000000000000");

        const nearLower = getAmountsForLiquidity(
          sqrtPriceNearLowerX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        const nearUpper = getAmountsForLiquidity(
          sqrtPriceNearUpperX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        // Near lower bound should have more token0
        expect(nearLower.amount0).toBeGreaterThan(nearUpper.amount0);
        // Near upper bound should have more token1
        expect(nearUpper.amount1).toBeGreaterThan(nearLower.amount1);
      });
    });

    describe("Position below range", () => {
      it("should have all liquidity in token0 when price is below range", () => {
        const tickLower = 200000;
        const tickUpper = 210000;
        const tickCurrent = 195000; // Below range

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("1000000000000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        expect(amount0).toBeGreaterThan(BigInt(0));
        expect(amount1).toBe(BigInt(0));
      });

      it("should have same amount0 regardless of how far below range", () => {
        const tickLower = 200000;
        const tickUpper = 210000;
        const tickFarBelow = 180000;
        const tickNearBelow = 199000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceFarBelowX96 = getSqrtPriceX96FromTick(tickFarBelow);
        const sqrtPriceNearBelowX96 = getSqrtPriceX96FromTick(tickNearBelow);
        const liquidity = BigInt("1000000000000000");

        const farBelow = getAmountsForLiquidity(
          sqrtPriceFarBelowX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        const nearBelow = getAmountsForLiquidity(
          sqrtPriceNearBelowX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        expect(farBelow.amount0).toBe(nearBelow.amount0);
        expect(farBelow.amount1).toBe(BigInt(0));
        expect(nearBelow.amount1).toBe(BigInt(0));
      });
    });

    describe("Position above range", () => {
      it("should have all liquidity in token1 when price is above range", () => {
        const tickLower = 190000;
        const tickUpper = 200000;
        const tickCurrent = 205000; // Above range

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("1000000000000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        expect(amount0).toBe(BigInt(0));
        expect(amount1).toBeGreaterThan(BigInt(0));
      });

      it("should have same amount1 regardless of how far above range", () => {
        const tickLower = 190000;
        const tickUpper = 200000;
        const tickFarAbove = 220000;
        const tickNearAbove = 201000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceFarAboveX96 = getSqrtPriceX96FromTick(tickFarAbove);
        const sqrtPriceNearAboveX96 = getSqrtPriceX96FromTick(tickNearAbove);
        const liquidity = BigInt("1000000000000000");

        const farAbove = getAmountsForLiquidity(
          sqrtPriceFarAboveX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        const nearAbove = getAmountsForLiquidity(
          sqrtPriceNearAboveX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        expect(farAbove.amount1).toBe(nearAbove.amount1);
        expect(farAbove.amount0).toBe(BigInt(0));
        expect(nearAbove.amount0).toBe(BigInt(0));
      });
    });

    describe("Edge cases", () => {
      it("should handle current price exactly at lower tick", () => {
        const tickLower = 195000;
        const tickUpper = 205000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const liquidity = BigInt("1000000000000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceLowerX96, // Current price = lower bound
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        // At lower bound, position should be all in token0
        expect(amount0).toBeGreaterThan(BigInt(0));
        expect(amount1).toBe(BigInt(0));
      });

      it("should handle current price exactly at upper tick", () => {
        const tickLower = 195000;
        const tickUpper = 205000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const liquidity = BigInt("1000000000000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceUpperX96, // Current price = upper bound
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        // At upper bound, position should be all in token1
        expect(amount0).toBe(BigInt(0));
        expect(amount1).toBeGreaterThan(BigInt(0));
      });

      it("should handle zero liquidity", () => {
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 200000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt(0);

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        expect(amount0).toBe(BigInt(0));
        expect(amount1).toBe(BigInt(0));
      });

      it("should handle very tight price ranges", () => {
        const tickLower = 200000;
        const tickUpper = 200010; // Very tight range
        const tickCurrent = 200005;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("1000000000000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        // Should still calculate valid amounts
        expect(amount0).toBeGreaterThan(BigInt(0));
        expect(amount1).toBeGreaterThan(BigInt(0));
      });

      it("should handle maximum tick range", () => {
        const tickLower = -887272;
        const tickUpper = 887272;
        const tickCurrent = 0;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("1000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        // Should calculate without overflow
        expect(amount0).toBeGreaterThan(BigInt(0));
        expect(amount1).toBeGreaterThan(BigInt(0));
      });
    });

    describe("Real-world WETH/USDT position examples", () => {
      it("should calculate amounts for typical WETH/USDT position", () => {
        // Real position data from WETH/USDT pool
        const tickLower = 195180;
        const tickUpper = 202020;
        const tickCurrent = 200000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("50000000000000000"); // Typical liquidity value

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        // Both amounts should be positive for in-range position
        expect(amount0).toBeGreaterThan(BigInt(0));
        expect(amount1).toBeGreaterThan(BigInt(0));

        // Sanity check: amounts should be reasonable
        // Not too small (dust) and not astronomically large
        expect(amount0.toString().length).toBeGreaterThan(10); // At least some value
        expect(amount0.toString().length).toBeLessThan(30);    // Not overflow
      });

      it("should properly handle out-of-range WETH/USDT position", () => {
        // Position with price moved above range
        const tickLower = 190000;
        const tickUpper = 195000;
        const tickCurrent = 200000; // Price above range

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("100000000000000000");

        const { amount0, amount1 } = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity
        );

        // All liquidity in token1 (USDT) when price above range
        expect(amount0).toBe(BigInt(0));
        expect(amount1).toBeGreaterThan(BigInt(0));
      });
    });

    describe("Mathematical properties", () => {
      it("should conserve value when liquidity is doubled", () => {
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 200000;

        const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
        const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);

        const liquidity1 = BigInt("1000000000000000");
        const liquidity2 = liquidity1 * BigInt(2);

        const amounts1 = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity1
        );

        const amounts2 = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          sqrtPriceLowerX96,
          sqrtPriceUpperX96,
          liquidity2
        );

        expect(amounts2.amount0).toBe(amounts1.amount0 * BigInt(2));
        expect(amounts2.amount1).toBe(amounts1.amount1 * BigInt(2));
      });

      it("should be consistent with range width", () => {
        const tickCurrent = 200000;
        const sqrtPriceCurrentX96 = getSqrtPriceX96FromTick(tickCurrent);
        const liquidity = BigInt("1000000000000000");

        // Narrow range
        const narrowLower = getSqrtPriceX96FromTick(199000);
        const narrowUpper = getSqrtPriceX96FromTick(201000);
        const narrowAmounts = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          narrowLower,
          narrowUpper,
          liquidity
        );

        // Wide range
        const wideLower = getSqrtPriceX96FromTick(190000);
        const wideUpper = getSqrtPriceX96FromTick(210000);
        const wideAmounts = getAmountsForLiquidity(
          sqrtPriceCurrentX96,
          wideLower,
          wideUpper,
          liquidity
        );

        // Narrow range should have less total tokens than wide range
        const narrowTotal = narrowAmounts.amount0 + narrowAmounts.amount1;
        const wideTotal = wideAmounts.amount0 + wideAmounts.amount1;

        expect(wideTotal).toBeGreaterThan(narrowTotal);
      });
    });
  });
});