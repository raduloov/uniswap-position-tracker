import { STABLECOIN_SYMBOLS } from "../../src/constants";

// Mock function to simulate USD calculation logic from uniswapClient
function calculateUSDValues(
  token0Symbol: string,
  token1Symbol: string,
  token0Amount: number,
  token1Amount: number,
  token0PriceInToken1: number,
  token1PriceInToken0: number
) {
  const token0IsStable = STABLECOIN_SYMBOLS.includes(token0Symbol.toUpperCase() as any);
  const token1IsStable = STABLECOIN_SYMBOLS.includes(token1Symbol.toUpperCase() as any);

  let token0USD = 0;
  let token1USD = 0;

  if (token0IsStable) {
    const pricePerToken0 = 1;
    const pricePerToken1 = token1PriceInToken0;
    token0USD = token0Amount * pricePerToken0;
    token1USD = token1Amount * pricePerToken1;
  } else if (token1IsStable) {
    const pricePerToken1 = 1;
    const pricePerToken0 = token0PriceInToken1;
    token0USD = token0Amount * pricePerToken0;
    token1USD = token1Amount * pricePerToken1;
  } else {
    // Neither is a stablecoin
    token0USD = token0Amount * token0PriceInToken1;
    token1USD = token1Amount * 1;
  }

  return { token0USD, token1USD, totalUSD: token0USD + token1USD };
}

describe("USD Value Calculations", () => {
  describe("Stablecoin identification", () => {
    it("should identify common stablecoins", () => {
      const stablecoins = ["USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "GUSD"];

      stablecoins.forEach(symbol => {
        expect(STABLECOIN_SYMBOLS).toContain(symbol);
      });
    });

    it("should not identify non-stablecoins as stable", () => {
      const nonStablecoins = ["WETH", "ETH", "WBTC", "UNI", "LINK", "MATIC"];

      nonStablecoins.forEach(symbol => {
        expect(STABLECOIN_SYMBOLS).not.toContain(symbol);
      });
    });

    it("should handle case variations", () => {
      const testSymbol = "usdt";
      const isStable = STABLECOIN_SYMBOLS.includes(testSymbol.toUpperCase() as any);
      expect(isStable).toBe(true);
    });
  });

  describe("USD value calculation logic", () => {
    describe("WETH/USDT pool", () => {
      it("should calculate USD values when token1 is USDT", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          1.5,      // 1.5 WETH
          4500,     // 4500 USDT
          3000,     // WETH price in USDT
          1/3000    // USDT price in WETH
        );

        expect(result.token0USD).toBe(1.5 * 3000); // 4500 USD
        expect(result.token1USD).toBe(4500 * 1);    // 4500 USD
        expect(result.totalUSD).toBe(9000);
      });

      it("should handle zero amounts", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          0,
          0,
          3000,
          1/3000
        );

        expect(result.token0USD).toBe(0);
        expect(result.token1USD).toBe(0);
        expect(result.totalUSD).toBe(0);
      });

      it("should handle out-of-range position (all USDT)", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          0,        // No WETH
          10000,    // All USDT
          3500,
          1/3500
        );

        expect(result.token0USD).toBe(0);
        expect(result.token1USD).toBe(10000);
        expect(result.totalUSD).toBe(10000);
      });

      it("should handle out-of-range position (all WETH)", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          3,        // All WETH
          0,        // No USDT
          2800,
          1/2800
        );

        expect(result.token0USD).toBe(3 * 2800);
        expect(result.token1USD).toBe(0);
        expect(result.totalUSD).toBe(8400);
      });
    });

    describe("USDC/WETH pool (inverted stablecoin)", () => {
      it("should calculate USD values when token0 is USDC", () => {
        const result = calculateUSDValues(
          "USDC",
          "WETH",
          5000,     // 5000 USDC
          2,        // 2 WETH
          1/2500,   // USDC price in WETH
          2500      // WETH price in USDC
        );

        expect(result.token0USD).toBe(5000 * 1);    // 5000 USD
        expect(result.token1USD).toBe(2 * 2500);    // 5000 USD
        expect(result.totalUSD).toBe(10000);
      });
    });

    describe("DAI/USDC pool (both stablecoins)", () => {
      it("should handle when token0 is stable", () => {
        const result = calculateUSDValues(
          "DAI",
          "USDC",
          1000,     // 1000 DAI
          1000,     // 1000 USDC
          1,        // DAI price in USDC (should be ~1)
          1         // USDC price in DAI (should be ~1)
        );

        // When token0 is stable, it takes precedence
        expect(result.token0USD).toBe(1000);
        expect(result.token1USD).toBe(1000);
        expect(result.totalUSD).toBe(2000);
      });
    });

    describe("Non-stablecoin pools", () => {
      it("should use exchange rate as fallback for WETH/WBTC", () => {
        const result = calculateUSDValues(
          "WETH",
          "WBTC",
          10,       // 10 WETH
          0.5,      // 0.5 WBTC
          0.05,     // WETH price in WBTC
          20        // WBTC price in WETH
        );

        // Falls back to using token1 as $1
        expect(result.token0USD).toBe(10 * 0.05);
        expect(result.token1USD).toBe(0.5 * 1);
        expect(result.totalUSD).toBe(1);
      });

      it("should handle UNI/WETH pool", () => {
        const result = calculateUSDValues(
          "UNI",
          "WETH",
          100,      // 100 UNI
          2,        // 2 WETH
          0.002,    // UNI price in WETH
          500       // WETH price in UNI
        );

        expect(result.token0USD).toBe(100 * 0.002);
        expect(result.token1USD).toBe(2 * 1);
        expect(result.totalUSD).toBe(2.2);
      });
    });

    describe("Edge cases", () => {
      it("should handle very small amounts", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          0.0001,
          0.3,
          3000,
          1/3000
        );

        expect(result.token0USD).toBeCloseTo(0.3, 4);
        expect(result.token1USD).toBe(0.3);
        expect(result.totalUSD).toBeCloseTo(0.6, 4);
      });

      it("should handle very large amounts", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          1000000,
          3000000000,
          3000,
          1/3000
        );

        expect(result.token0USD).toBe(3000000000);
        expect(result.token1USD).toBe(3000000000);
        expect(result.totalUSD).toBe(6000000000);
      });

      it("should handle zero prices gracefully", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          1,
          1000,
          0,
          0
        );

        expect(result.token0USD).toBe(0);
        expect(result.token1USD).toBe(1000);
        expect(result.totalUSD).toBe(1000);
      });

      it("should handle negative prices (error case)", () => {
        const result = calculateUSDValues(
          "WETH",
          "USDT",
          1,
          1000,
          -3000,
          -1/3000
        );

        // Should still calculate, even if nonsensical
        expect(result.token0USD).toBe(-3000);
        expect(result.token1USD).toBe(1000);
        expect(result.totalUSD).toBe(-2000);
      });
    });

    describe("Price calculation for fees", () => {
      function calculateFeePrices(
        token0Symbol: string,
        token1Symbol: string,
        token0PriceInToken1: number,
        token1PriceInToken0: number
      ) {
        const token0IsStable = STABLECOIN_SYMBOLS.includes(token0Symbol.toUpperCase() as any);
        const token1IsStable = STABLECOIN_SYMBOLS.includes(token1Symbol.toUpperCase() as any);

        let pricePerToken0 = 0;
        let pricePerToken1 = 0;

        if (token0IsStable) {
          pricePerToken0 = 1;
          pricePerToken1 = token1PriceInToken0;
        } else if (token1IsStable) {
          pricePerToken0 = token0PriceInToken1;
          pricePerToken1 = 1;
        } else {
          pricePerToken0 = token0PriceInToken1;
          pricePerToken1 = 1;
        }

        return { pricePerToken0, pricePerToken1 };
      }

      it("should calculate fee prices for WETH/USDT", () => {
        const result = calculateFeePrices(
          "WETH",
          "USDT",
          3000,
          1/3000
        );

        expect(result.pricePerToken0).toBe(3000); // WETH price in USD
        expect(result.pricePerToken1).toBe(1);    // USDT price in USD
      });

      it("should calculate fee prices for USDC/WETH", () => {
        const result = calculateFeePrices(
          "USDC",
          "WETH",
          1/2500,
          2500
        );

        expect(result.pricePerToken0).toBe(1);    // USDC price in USD
        expect(result.pricePerToken1).toBe(2500); // WETH price in USD
      });

      it("should handle non-stablecoin pools", () => {
        const result = calculateFeePrices(
          "UNI",
          "WETH",
          0.002,
          500
        );

        expect(result.pricePerToken0).toBe(0.002);
        expect(result.pricePerToken1).toBe(1);
      });
    });

    describe("Total value calculations", () => {
      it("should calculate total position value including fees", () => {
        const tokenValues = calculateUSDValues(
          "WETH",
          "USDT",
          2,
          6000,
          3000,
          1/3000
        );

        const feeUSD0 = 0.001 * 3000; // 0.001 WETH in fees
        const feeUSD1 = 10 * 1;       // 10 USDT in fees

        const totalValue = tokenValues.totalUSD + feeUSD0 + feeUSD1;

        expect(totalValue).toBe(12000 + 3 + 10);
      });

      it("should handle positions with zero liquidity but uncollected fees", () => {
        const tokenValues = calculateUSDValues(
          "WETH",
          "USDT",
          0,
          0,
          3000,
          1/3000
        );

        const feeUSD0 = 0.5 * 3000;
        const feeUSD1 = 100 * 1;

        const totalValue = tokenValues.totalUSD + feeUSD0 + feeUSD1;

        expect(totalValue).toBe(1500 + 100);
      });
    });
  });

  describe("Real-world scenarios", () => {
    describe("WETH/USDT position examples", () => {
      it("should calculate values for typical in-range position", () => {
        // Position: 1.5 WETH, 4500 USDT, 0.01 WETH fees, 30 USDT fees
        // WETH price: $3000
        const tokenValues = {
          token0USD: 1.5 * 3000,
          token1USD: 4500 * 1,
          fee0USD: 0.01 * 3000,
          fee1USD: 30 * 1
        };

        const totalValue = tokenValues.token0USD + tokenValues.token1USD +
                          tokenValues.fee0USD + tokenValues.fee1USD;

        expect(totalValue).toBe(4500 + 4500 + 30 + 30);
        expect(totalValue).toBe(9060);
      });

      it("should calculate values for out-of-range position", () => {
        // Position moved above range: 0 WETH, 10000 USDT, small fees
        const tokenValues = {
          token0USD: 0,
          token1USD: 10000 * 1,
          fee0USD: 0.002 * 3500, // Price moved up to $3500
          fee1USD: 15 * 1
        };

        const totalValue = tokenValues.token0USD + tokenValues.token1USD +
                          tokenValues.fee0USD + tokenValues.fee1USD;

        expect(totalValue).toBe(0 + 10000 + 7 + 15);
        expect(totalValue).toBe(10022);
      });
    });

    describe("Multiple pool types", () => {
      it("should handle USDC/WETH pool correctly", () => {
        // USDC is token0, WETH is token1
        const result = calculateUSDValues(
          "USDC",
          "WETH",
          3000,     // 3000 USDC
          1,        // 1 WETH
          1/3000,   // USDC price in WETH
          3000      // WETH price in USDC
        );

        expect(result.totalUSD).toBe(6000);
      });

      it("should handle WBTC/WETH pool correctly", () => {
        // Neither is stablecoin, falls back to exchange rate
        const result = calculateUSDValues(
          "WBTC",
          "WETH",
          0.1,      // 0.1 WBTC
          1.5,      // 1.5 WETH
          15,       // WBTC price in WETH
          1/15      // WETH price in WBTC
        );

        // Uses WETH as $1 (fallback)
        expect(result.token0USD).toBe(0.1 * 15);
        expect(result.token1USD).toBe(1.5 * 1);
        expect(result.totalUSD).toBe(3);
      });
    });
  });
});