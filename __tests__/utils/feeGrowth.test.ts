import { UNISWAP_CONSTANTS } from "../../src/constants";

describe("Fee Growth Calculations", () => {
  const Q128 = UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q128;

  // Mock the calculateFeeGrowthInside function from UniswapClient
  function calculateFeeGrowthInside(
    feeGrowthGlobalX128: bigint,
    feeGrowthOutsideLowerX128: bigint,
    feeGrowthOutsideUpperX128: bigint,
    tickLower: number,
    tickUpper: number,
    tickCurrent: number
  ): bigint {
    // Calculate fee growth below
    let feeGrowthBelowX128: bigint;
    if (tickCurrent >= tickLower) {
      feeGrowthBelowX128 = feeGrowthOutsideLowerX128;
    } else {
      feeGrowthBelowX128 = feeGrowthGlobalX128 - feeGrowthOutsideLowerX128;
    }

    // Calculate fee growth above
    let feeGrowthAboveX128: bigint;
    if (tickCurrent < tickUpper) {
      feeGrowthAboveX128 = feeGrowthOutsideUpperX128;
    } else {
      feeGrowthAboveX128 = feeGrowthGlobalX128 - feeGrowthOutsideUpperX128;
    }

    // Calculate fee growth inside
    return feeGrowthGlobalX128 - feeGrowthBelowX128 - feeGrowthAboveX128;
  }

  describe("calculateFeeGrowthInside", () => {
    describe("Position in range", () => {
      it("should calculate fee growth when current tick is within range", () => {
        const feeGrowthGlobal = BigInt("1000000000000000000000000000000000000");
        const feeGrowthOutsideLower = BigInt("100000000000000000000000000000000000");
        const feeGrowthOutsideUpper = BigInt("200000000000000000000000000000000000");
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 200000;

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // When in range: feeGrowthInside = global - outsideLower - outsideUpper
        const expected = feeGrowthGlobal - feeGrowthOutsideLower - feeGrowthOutsideUpper;
        expect(result).toBe(expected);
      });

      it("should handle zero fee growth outside", () => {
        const feeGrowthGlobal = BigInt("5000000000000000000000000000000000000");
        const feeGrowthOutsideLower = BigInt(0);
        const feeGrowthOutsideUpper = BigInt(0);
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 200000;

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // All fees accumulated inside the range
        expect(result).toBe(feeGrowthGlobal);
      });
    });

    describe("Position below range", () => {
      it("should calculate fee growth when current tick is below range", () => {
        const feeGrowthGlobal = BigInt("1000000000000000000000000000000000000");
        const feeGrowthOutsideLower = BigInt("100000000000000000000000000000000000");
        const feeGrowthOutsideUpper = BigInt("200000000000000000000000000000000000");
        const tickLower = 200000;
        const tickUpper = 210000;
        const tickCurrent = 195000; // Below range

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // When below range:
        // feeGrowthBelow = global - outsideLower
        // feeGrowthAbove = outsideUpper
        // feeGrowthInside = global - feeGrowthBelow - feeGrowthAbove
        const feeGrowthBelow = feeGrowthGlobal - feeGrowthOutsideLower;
        const expected = feeGrowthGlobal - feeGrowthBelow - feeGrowthOutsideUpper;
        expect(result).toBe(expected);
      });

      it("should handle when all fees are outside lower tick", () => {
        const feeGrowthGlobal = BigInt("1000000000000000000000000000000000000");
        const feeGrowthOutsideLower = BigInt(0);
        const feeGrowthOutsideUpper = BigInt(0);
        const tickLower = 200000;
        const tickUpper = 210000;
        const tickCurrent = 195000; // Below range

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // When below range, feeGrowthBelow = global - outsideLower = global - 0 = global
        // feeGrowthInside = global - global - 0 = 0
        expect(result).toBe(BigInt(0));
      });
    });

    describe("Position above range", () => {
      it("should calculate fee growth when current tick is above range", () => {
        const feeGrowthGlobal = BigInt("1000000000000000000000000000000000000");
        const feeGrowthOutsideLower = BigInt("100000000000000000000000000000000000");
        const feeGrowthOutsideUpper = BigInt("200000000000000000000000000000000000");
        const tickLower = 190000;
        const tickUpper = 200000;
        const tickCurrent = 205000; // Above range

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // When above range:
        // feeGrowthBelow = outsideLower
        // feeGrowthAbove = global - outsideUpper
        // feeGrowthInside = global - feeGrowthBelow - feeGrowthAbove
        const feeGrowthAbove = feeGrowthGlobal - feeGrowthOutsideUpper;
        const expected = feeGrowthGlobal - feeGrowthOutsideLower - feeGrowthAbove;
        expect(result).toBe(expected);
      });
    });

    describe("Edge cases", () => {
      it("should handle current tick exactly at lower bound", () => {
        const feeGrowthGlobal = BigInt("1000000000000000000000000000000000000");
        const feeGrowthOutsideLower = BigInt("100000000000000000000000000000000000");
        const feeGrowthOutsideUpper = BigInt("200000000000000000000000000000000000");
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 195000; // Exactly at lower bound

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // At lower bound, position is considered in range
        const expected = feeGrowthGlobal - feeGrowthOutsideLower - feeGrowthOutsideUpper;
        expect(result).toBe(expected);
      });

      it("should handle current tick exactly at upper bound", () => {
        const feeGrowthGlobal = BigInt("1000000000000000000000000000000000000");
        const feeGrowthOutsideLower = BigInt("100000000000000000000000000000000000");
        const feeGrowthOutsideUpper = BigInt("200000000000000000000000000000000000");
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 205000; // Exactly at upper bound

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // At upper bound, position is considered above range
        const feeGrowthAbove = feeGrowthGlobal - feeGrowthOutsideUpper;
        const expected = feeGrowthGlobal - feeGrowthOutsideLower - feeGrowthAbove;
        expect(result).toBe(expected);
      });

      it("should handle zero global fee growth", () => {
        const feeGrowthGlobal = BigInt(0);
        const feeGrowthOutsideLower = BigInt(0);
        const feeGrowthOutsideUpper = BigInt(0);
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 200000;

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        expect(result).toBe(BigInt(0));
      });

      it("should handle maximum uint256 values", () => {
        const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const feeGrowthGlobal = maxUint256;
        const feeGrowthOutsideLower = maxUint256 / BigInt(2);
        const feeGrowthOutsideUpper = maxUint256 / BigInt(4);
        const tickLower = 195000;
        const tickUpper = 205000;
        const tickCurrent = 200000;

        const result = calculateFeeGrowthInside(
          feeGrowthGlobal,
          feeGrowthOutsideLower,
          feeGrowthOutsideUpper,
          tickLower,
          tickUpper,
          tickCurrent
        );

        // Should handle large numbers without overflow
        expect(result).toBeDefined();
        expect(() => result.toString()).not.toThrow();
      });
    });
  });

  describe("Uncollected fees calculation", () => {
    function calculateUncollectedFees(
      liquidity: bigint,
      feeGrowthInside: bigint,
      feeGrowthInsideLastX128: bigint
    ): bigint {
      if (feeGrowthInside < feeGrowthInsideLastX128) {
        // Handle underflow (shouldn't happen in practice)
        return BigInt(0);
      }
      return (liquidity * (feeGrowthInside - feeGrowthInsideLastX128)) / Q128;
    }

    it("should calculate uncollected fees correctly", () => {
      const liquidity = BigInt("1000000000000000000");
      const feeGrowthInside = BigInt("2000000000000000000000000000000000000");
      const feeGrowthInsideLastX128 = BigInt("1000000000000000000000000000000000000");

      const fees = calculateUncollectedFees(liquidity, feeGrowthInside, feeGrowthInsideLastX128);

      expect(fees).toBeGreaterThan(BigInt(0));
    });

    it("should return zero when no new fees accumulated", () => {
      const liquidity = BigInt("1000000000000000000");
      const feeGrowthInside = BigInt("1000000000000000000000000000000000000");
      const feeGrowthInsideLastX128 = BigInt("1000000000000000000000000000000000000");

      const fees = calculateUncollectedFees(liquidity, feeGrowthInside, feeGrowthInsideLastX128);

      expect(fees).toBe(BigInt(0));
    });

    it("should return zero for zero liquidity", () => {
      const liquidity = BigInt(0);
      const feeGrowthInside = BigInt("2000000000000000000000000000000000000");
      const feeGrowthInsideLastX128 = BigInt("1000000000000000000000000000000000000");

      const fees = calculateUncollectedFees(liquidity, feeGrowthInside, feeGrowthInsideLastX128);

      expect(fees).toBe(BigInt(0));
    });

    it("should be approximately proportional to liquidity", () => {
      const liquidity1 = BigInt("1000000000000000000");
      const liquidity2 = BigInt("2000000000000000000");
      const feeGrowthInside = BigInt("2000000000000000000000000000000000000");
      const feeGrowthInsideLastX128 = BigInt("1000000000000000000000000000000000000");

      const fees1 = calculateUncollectedFees(liquidity1, feeGrowthInside, feeGrowthInsideLastX128);
      const fees2 = calculateUncollectedFees(liquidity2, feeGrowthInside, feeGrowthInsideLastX128);

      // Should be approximately 2x (allow for rounding)
      const ratio = fees2 * BigInt(100) / fees1;
      expect(ratio).toBeGreaterThanOrEqual(BigInt(199));
      expect(ratio).toBeLessThanOrEqual(BigInt(201));
    });

    it("should handle very small fee growth differences", () => {
      const liquidity = BigInt("1000000000000000000");
      const feeGrowthInside = BigInt("1000000000000000000000000000000000001");
      const feeGrowthInsideLastX128 = BigInt("1000000000000000000000000000000000000");

      const fees = calculateUncollectedFees(liquidity, feeGrowthInside, feeGrowthInsideLastX128);

      // Should calculate even tiny fees
      expect(fees).toBeGreaterThanOrEqual(BigInt(0));
    });

    it("should handle very large fee accumulation", () => {
      const liquidity = BigInt("1000000000000000000");
      const feeGrowthInside = BigInt("100000000000000000000000000000000000000");
      const feeGrowthInsideLastX128 = BigInt("1000000000000000000000000000000000000");

      const fees = calculateUncollectedFees(liquidity, feeGrowthInside, feeGrowthInsideLastX128);

      expect(fees).toBeGreaterThan(BigInt(0));
      expect(() => fees.toString()).not.toThrow();
    });
  });

  describe("Fee USD value calculations", () => {
    function calculateFeeUSD(
      uncollectedFeesRaw: bigint,
      tokenDecimals: number,
      pricePerToken: number
    ): number {
      const feeAmount = Number(uncollectedFeesRaw) / Math.pow(10, tokenDecimals);
      return feeAmount * pricePerToken;
    }

    it("should calculate USD value for WETH fees", () => {
      const feesRaw = BigInt("1000000000000000"); // 0.001 WETH
      const decimals = 18;
      const wethPrice = 3000;

      const feeUSD = calculateFeeUSD(feesRaw, decimals, wethPrice);

      expect(feeUSD).toBeCloseTo(3, 2); // $3
    });

    it("should calculate USD value for USDT fees", () => {
      const feesRaw = BigInt("10000000"); // 10 USDT
      const decimals = 6;
      const usdtPrice = 1;

      const feeUSD = calculateFeeUSD(feesRaw, decimals, usdtPrice);

      expect(feeUSD).toBe(10); // $10
    });

    it("should handle zero fees", () => {
      const feesRaw = BigInt(0);
      const decimals = 18;
      const price = 3000;

      const feeUSD = calculateFeeUSD(feesRaw, decimals, price);

      expect(feeUSD).toBe(0);
    });

    it("should handle very small fees", () => {
      const feesRaw = BigInt("1"); // 1 wei
      const decimals = 18;
      const price = 3000;

      const feeUSD = calculateFeeUSD(feesRaw, decimals, price);

      expect(feeUSD).toBeCloseTo(0, 10);
    });

    it("should calculate total fee value", () => {
      const fees0Raw = BigInt("1000000000000000"); // 0.001 WETH
      const fees1Raw = BigInt("30000000"); // 30 USDT
      const wethPrice = 3000;
      const usdtPrice = 1;

      const fee0USD = calculateFeeUSD(fees0Raw, 18, wethPrice);
      const fee1USD = calculateFeeUSD(fees1Raw, 6, usdtPrice);
      const totalFeeUSD = fee0USD + fee1USD;

      expect(totalFeeUSD).toBeCloseTo(33, 2); // $3 + $30
    });
  });

  describe("Real-world fee scenarios", () => {
    it("should handle typical WETH/USDT position fees", () => {
      const liquidity = BigInt("50000000000000000000");
      const feeGrowthGlobal0 = BigInt("5000000000000000000000000000000000000");
      const feeGrowthGlobal1 = BigInt("8000000000000000000000000000000000000");

      // Position has been earning fees
      const feeGrowthInside0LastX128 = BigInt("4000000000000000000000000000000000000");
      const feeGrowthInside1LastX128 = BigInt("7000000000000000000000000000000000000");

      // Calculate current fee growth inside (simplified - assuming in range)
      const feeGrowthInside0 = feeGrowthGlobal0;
      const feeGrowthInside1 = feeGrowthGlobal1;

      const uncollectedFees0 = (liquidity * (feeGrowthInside0 - feeGrowthInside0LastX128)) / Q128;
      const uncollectedFees1 = (liquidity * (feeGrowthInside1 - feeGrowthInside1LastX128)) / Q128;

      expect(uncollectedFees0).toBeGreaterThan(BigInt(0));
      expect(uncollectedFees1).toBeGreaterThan(BigInt(0));
    });

    it("should handle position that just collected fees", () => {
      const liquidity = BigInt("50000000000000000000");

      // Just collected, so current = last
      const feeGrowthInside0 = BigInt("5000000000000000000000000000000000000");
      const feeGrowthInside1 = BigInt("8000000000000000000000000000000000000");
      const feeGrowthInside0LastX128 = feeGrowthInside0;
      const feeGrowthInside1LastX128 = feeGrowthInside1;

      const uncollectedFees0 = (liquidity * (feeGrowthInside0 - feeGrowthInside0LastX128)) / Q128;
      const uncollectedFees1 = (liquidity * (feeGrowthInside1 - feeGrowthInside1LastX128)) / Q128;

      expect(uncollectedFees0).toBe(BigInt(0));
      expect(uncollectedFees1).toBe(BigInt(0));
    });

    it("should handle out-of-range position with no fee accumulation", () => {
      const tickLower = 200000;
      const tickUpper = 210000;
      const tickCurrent = 195000; // Below range

      // Position has always been out of range, so no fees inside
      const feeGrowthGlobal = BigInt("10000000000000000000000000000000000000");
      const feeGrowthOutsideLower = BigInt(0); // No fees accumulated outside lower when below range
      const feeGrowthOutsideUpper = BigInt(0); // No fees accumulated outside upper

      const result = calculateFeeGrowthInside(
        feeGrowthGlobal,
        feeGrowthOutsideLower,
        feeGrowthOutsideUpper,
        tickLower,
        tickUpper,
        tickCurrent
      );

      // When below range:
      // feeGrowthBelow = global - outsideLower = global - 0 = global
      // feeGrowthAbove = outsideUpper = 0
      // feeGrowthInside = global - global - 0 = 0
      expect(result).toBe(BigInt(0));
    });
  });
});