import axios from "axios";
import { PositionData } from "./types";

// The Graph Network endpoints for Uniswap V3
const GRAPH_ENDPOINTS = {
  // Decentralized network endpoint (requires API key)
  decentralized: "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
  // Free development endpoint (rate limited)
  development:
    "https://gateway-arbitrum.network.thegraph.com/api/[api-key]/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
};

interface GraphQLPosition {
  id: string;
  owner: string;
  liquidity: string;
  tickLower: {
    tickIdx: string;
    feeGrowthOutside0X128: string;
    feeGrowthOutside1X128: string;
  };
  tickUpper: {
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

export class UniswapClient {
  private subgraphUrl: string;

  constructor(apiKey?: string) {
    if (apiKey) {
      // Use the decentralized network with API key
      this.subgraphUrl = GRAPH_ENDPOINTS.decentralized.replace("[api-key]", apiKey);
    } else {
      // Try the free development endpoint with a demo key
      this.subgraphUrl = GRAPH_ENDPOINTS.development.replace("[api-key]", "demo");
      console.log("⚠️  Using development endpoint. For production, get a free API key from https://thegraph.com");
    }
  }

  async getPositions(walletAddress: string, positionId?: string): Promise<PositionData[]> {
    try {
      const query = positionId
        ? this.buildPositionByIdQuery(positionId)
        : this.buildPositionsByOwnerQuery(walletAddress);

      const response = await axios.post(
        this.subgraphUrl,
        {
          query
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.errors) {
        console.error("GraphQL errors:", response.data.errors);

        // If the error is about the endpoint, provide helpful message
        if (response.data.errors[0]?.message?.includes("API key")) {
          console.log("\n📌 To use this tracker, you need a free API key from The Graph:");
          console.log("1. Go to https://thegraph.com/studio/apikeys/");
          console.log("2. Sign up for a free account");
          console.log("3. Create a new API key");
          console.log("4. Add GRAPH_API_KEY=your-key-here to your .env file\n");
        }
        return [];
      }

      const positions: GraphQLPosition[] = response.data.data?.positions;

      if (!positions || positions.length === 0) {
        console.log("No active positions found");
        return [];
      }

      return positions.map(pos => this.transformPosition(pos));
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("\n📌 Authentication required. Get a free API key from:");
        console.log("   https://thegraph.com/studio/apikeys/");
        console.log("   Then add GRAPH_API_KEY=your-key to .env\n");
      } else {
        console.error("Error fetching positions:", error.message);
      }
      return [];
    }
  }

  private buildPositionsByOwnerQuery(walletAddress: string): string {
    return `
      {
        positions(
          where: { owner: "${walletAddress.toLowerCase()}", liquidity_gt: 0 }
          first: 100
          orderBy: liquidity
          orderDirection: desc
        ) {
          ${this.getPositionFields()}
        }
      }
    `;
  }

  private buildPositionByIdQuery(positionId: string): string {
    return `
      {
        positions(where: { id: "${positionId}" }) {
          ${this.getPositionFields()}
        }
      }
    `;
  }

  private getPositionFields(): string {
    return `
      id
      owner
      liquidity
      tickLower {
        tickIdx
        feeGrowthOutside0X128
        feeGrowthOutside1X128
      }
      tickUpper {
        tickIdx
        feeGrowthOutside0X128
        feeGrowthOutside1X128
      }
      token0 {
        id
        symbol
        decimals
        name
      }
      token1 {
        id
        symbol
        decimals
        name
      }
      pool {
        id
        feeTier
        sqrtPrice
        tick
        token0Price
        token1Price
        liquidity
        feeGrowthGlobal0X128
        feeGrowthGlobal1X128
      }
      depositedToken0
      depositedToken1
      withdrawnToken0
      withdrawnToken1
      collectedFeesToken0
      collectedFeesToken1
      feeGrowthInside0LastX128
      feeGrowthInside1LastX128
    `;
  }

  private transformPosition(pos: GraphQLPosition): PositionData {
    // Get decimals
    const decimals0 = parseInt(pos.token0.decimals);
    const decimals1 = parseInt(pos.token1.decimals);

    // Parse tick values
    const tickLower = parseInt(pos.tickLower.tickIdx);
    const tickUpper = parseInt(pos.tickUpper.tickIdx);
    const currentTick = parseInt(pos.pool.tick);

    // Calculate sqrt prices
    const sqrtPriceX96 = BigInt(pos.pool.sqrtPrice);
    const sqrtPriceLowerX96 = this.getSqrtPriceX96FromTick(tickLower);
    const sqrtPriceUpperX96 = this.getSqrtPriceX96FromTick(tickUpper);

    // Calculate current amounts
    const liquidity = BigInt(pos.liquidity);
    const amounts = this.getAmountsForLiquidity(sqrtPriceX96, sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);

    // Convert to human readable format
    const token0Amount = Number(amounts.amount0) / Math.pow(10, decimals0);
    const token1Amount = Number(amounts.amount1) / Math.pow(10, decimals1);

    // Calculate prices in terms of each other
    // NOTE: The Graph's token0Price and token1Price are inverted from what you'd expect
    // token0Price actually means "price of token1 in terms of token0"
    // token1Price actually means "price of token0 in terms of token1"
    const token1PriceInToken0 = parseFloat(pos.pool.token0Price); // Despite the name, this is token1's price
    const token0PriceInToken1 = parseFloat(pos.pool.token1Price); // Despite the name, this is token0's price

    // Determine USD prices based on stablecoin presence
    let token0USD = 0;
    let token1USD = 0;

    // Check if either token is a stablecoin
    const stablecoins = ["USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "GUSD"];
    const token0IsStable = stablecoins.includes(pos.token0.symbol.toUpperCase());
    const token1IsStable = stablecoins.includes(pos.token1.symbol.toUpperCase());

    if (token0IsStable) {
      // Token0 is a stablecoin worth $1
      const pricePerToken0 = 1;
      const pricePerToken1 = token1PriceInToken0; // How many token0 (USD) per token1
      token0USD = token0Amount * pricePerToken0;
      token1USD = token1Amount * pricePerToken1;
    } else if (token1IsStable) {
      // Token1 is a stablecoin worth $1
      const pricePerToken1 = 1;
      const pricePerToken0 = token0PriceInToken1; // How many token1 (USD) per token0
      token0USD = token0Amount * pricePerToken0;
      token1USD = token1Amount * pricePerToken1;
    } else {
      // Neither is a stablecoin, can't calculate USD without external price oracle
      // Just use the exchange rate between them
      token0USD = token0Amount * token0PriceInToken1;
      token1USD = token1Amount * 1; // Assume token1 = $1 as fallback
    }

    // Calculate uncollected fees using Uniswap V3 fee growth tracking
    const feeGrowthInside0 = this.calculateFeeGrowthInside(
      BigInt(pos.pool.feeGrowthGlobal0X128 || "0"),
      BigInt(pos.tickLower.feeGrowthOutside0X128 || "0"),
      BigInt(pos.tickUpper.feeGrowthOutside0X128 || "0"),
      tickLower,
      tickUpper,
      currentTick
    );

    const feeGrowthInside1 = this.calculateFeeGrowthInside(
      BigInt(pos.pool.feeGrowthGlobal1X128 || "0"),
      BigInt(pos.tickLower.feeGrowthOutside1X128 || "0"),
      BigInt(pos.tickUpper.feeGrowthOutside1X128 || "0"),
      tickLower,
      tickUpper,
      currentTick
    );

    // Calculate fees owed
    const feeGrowthInside0LastX128 = BigInt(pos.feeGrowthInside0LastX128 || "0");
    const feeGrowthInside1LastX128 = BigInt(pos.feeGrowthInside1LastX128 || "0");

    const uncollectedFees0Big = (liquidity * (feeGrowthInside0 - feeGrowthInside0LastX128)) / BigInt(2) ** BigInt(128);
    const uncollectedFees1Big = (liquidity * (feeGrowthInside1 - feeGrowthInside1LastX128)) / BigInt(2) ** BigInt(128);

    // Convert to decimal amounts
    const uncollectedFees0 = Number(uncollectedFees0Big) / Math.pow(10, decimals0);
    const uncollectedFees1 = Number(uncollectedFees1Big) / Math.pow(10, decimals1);

    // Calculate price range in human-readable format
    let priceRange = undefined;

    // We already have the current price from the Graph
    // token0PriceInToken1 is actually token1Price (confusing Graph naming)
    // This represents WETH price in USDT
    const currentWETHPrice = token0PriceInToken1;

    // Calculate the ratio between current price and tick bounds
    // This gives us a more reliable way to calculate the price range
    const poolCurrentTick = parseInt(pos.pool.tick);

    // Calculate how many ticks away the bounds are from current
    const ticksToLower = poolCurrentTick - tickLower;
    const ticksToUpper = tickUpper - poolCurrentTick;

    // Each tick represents a 0.01% (1.0001) price change
    // So price at tick = current_price * (1.0001 ^ tick_difference)
    const priceRatioLower = Math.pow(1.0001, -ticksToLower);
    const priceRatioUpper = Math.pow(1.0001, ticksToUpper);

    if (token1IsStable) {
      // Show WETH price range in USDT
      priceRange = {
        lower: currentWETHPrice * priceRatioLower,
        upper: currentWETHPrice * priceRatioUpper,
        current: currentWETHPrice,
        currency: pos.token1.symbol
      };
    } else if (token0IsStable) {
      // Show token1 price range in token0 (stablecoin)
      const currentToken1Price = 1 / token1PriceInToken0;
      priceRange = {
        lower: currentToken1Price * priceRatioLower,
        upper: currentToken1Price * priceRatioUpper,
        current: currentToken1Price,
        currency: pos.token0.symbol
      };
    } else {
      // Neither is stable, use the exchange rate
      priceRange = {
        lower: currentWETHPrice * priceRatioLower,
        upper: currentWETHPrice * priceRatioUpper,
        current: currentWETHPrice,
        currency: pos.token1.symbol
      };
    }

    return {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      positionId: pos.id,
      owner: pos.owner,
      token0: {
        symbol: pos.token0.symbol,
        address: pos.token0.id,
        amount: token0Amount.toFixed(6),
        valueUSD: token0USD
      },
      token1: {
        symbol: pos.token1.symbol,
        address: pos.token1.id,
        amount: token1Amount.toFixed(6),
        valueUSD: token1USD
      },
      liquidity: pos.liquidity,
      tickLower: tickLower,
      tickUpper: tickUpper,
      fee: parseInt(pos.pool.feeTier),
      uncollectedFees: {
        token0: uncollectedFees0.toFixed(6),
        token1: uncollectedFees1.toFixed(6),
        token0USD: uncollectedFees0 * (token0USD / token0Amount),
        token1USD: uncollectedFees1 * (token1USD / token1Amount),
        totalUSD: uncollectedFees0 * (token0USD / token0Amount) + uncollectedFees1 * (token1USD / token1Amount)
      },
      totalValueUSD: token0USD + token1USD,
      pool: {
        address: pos.pool.id,
        currentTick: currentTick,
        sqrtPriceX96: pos.pool.sqrtPrice
      },
      priceRange: priceRange
    };
  }

  private getSqrtPriceX96FromTick(tick: number): bigint {
    const absTick = tick < 0 ? -tick : tick;
    let ratio =
      (absTick & 0x1) !== 0
        ? BigInt("0xfffcb933bd6fad37aa2d162d1a594001")
        : BigInt("0x100000000000000000000000000000000");

    if ((absTick & 0x2) !== 0) ratio = (ratio * BigInt("0xfff97272373d413259a46990580e213a")) >> 128n;
    if ((absTick & 0x4) !== 0) ratio = (ratio * BigInt("0xfff2e50f5f656932ef12357cf3c7fdcc")) >> 128n;
    if ((absTick & 0x8) !== 0) ratio = (ratio * BigInt("0xffe5caca7e10e4e61c3624eaa0941cd0")) >> 128n;
    if ((absTick & 0x10) !== 0) ratio = (ratio * BigInt("0xffcb9843d60f6159c9db58835c926644")) >> 128n;
    if ((absTick & 0x20) !== 0) ratio = (ratio * BigInt("0xff973b41fa98c081472e6896dfb254c0")) >> 128n;
    if ((absTick & 0x40) !== 0) ratio = (ratio * BigInt("0xff2ea16466c96a3843ec78b326b52861")) >> 128n;
    if ((absTick & 0x80) !== 0) ratio = (ratio * BigInt("0xfe5dee046a99a2a811c461f1969c3053")) >> 128n;
    if ((absTick & 0x100) !== 0) ratio = (ratio * BigInt("0xfcbe86c7900a88aedcffc83b479aa3a4")) >> 128n;
    if ((absTick & 0x200) !== 0) ratio = (ratio * BigInt("0xf987a7253ac413176f2b074cf7815e54")) >> 128n;
    if ((absTick & 0x400) !== 0) ratio = (ratio * BigInt("0xf3392b0822b70005940c7a398e4b70f3")) >> 128n;
    if ((absTick & 0x800) !== 0) ratio = (ratio * BigInt("0xe7159475a2c29b7443b29c7fa6e889d9")) >> 128n;
    if ((absTick & 0x1000) !== 0) ratio = (ratio * BigInt("0xd097f3bdfd2022b8845ad8f792aa5825")) >> 128n;
    if ((absTick & 0x2000) !== 0) ratio = (ratio * BigInt("0xa9f746462d870fdf8a65dc1f90e061e5")) >> 128n;
    if ((absTick & 0x4000) !== 0) ratio = (ratio * BigInt("0x70d869a156d2a1b890bb3df62baf32f7")) >> 128n;
    if ((absTick & 0x8000) !== 0) ratio = (ratio * BigInt("0x31be135f97d08fd981231505542fcfa6")) >> 128n;
    if ((absTick & 0x10000) !== 0) ratio = (ratio * BigInt("0x9aa508b5b7a84e1c677de54f3e99bc9")) >> 128n;
    if ((absTick & 0x20000) !== 0) ratio = (ratio * BigInt("0x5d6af8dedb81196699c329225ee604")) >> 128n;
    if ((absTick & 0x40000) !== 0) ratio = (ratio * BigInt("0x2216e584f5fa1ea926041bedfe98")) >> 128n;
    if ((absTick & 0x80000) !== 0) ratio = (ratio * BigInt("0x48a170391f7dc42444e8fa2")) >> 128n;

    if (tick > 0) ratio = (BigInt(2) ** BigInt(256) - BigInt(1)) / ratio;

    // Shift right by 32 to get sqrtPriceX96
    return ratio >> 32n;
  }

  private getAmountsForLiquidity(
    sqrtPriceX96: bigint,
    sqrtPriceLowerX96: bigint,
    sqrtPriceUpperX96: bigint,
    liquidity: bigint
  ): { amount0: bigint; amount1: bigint } {
    let amount0: bigint;
    let amount1: bigint;

    if (sqrtPriceX96 <= sqrtPriceLowerX96) {
      // Current price is below the range, position is all in token0
      amount0 = this.getAmount0ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
      amount1 = 0n;
    } else if (sqrtPriceX96 >= sqrtPriceUpperX96) {
      // Current price is above the range, position is all in token1
      amount0 = 0n;
      amount1 = this.getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
    } else {
      // Current price is within the range
      amount0 = this.getAmount0ForLiquidity(sqrtPriceX96, sqrtPriceUpperX96, liquidity);
      amount1 = this.getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceX96, liquidity);
    }

    return { amount0, amount1 };
  }

  private getAmount0ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
    if (sqrtRatioAX96 > sqrtRatioBX96) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }

    const numerator = liquidity * BigInt(2) ** BigInt(96) * (sqrtRatioBX96 - sqrtRatioAX96);
    const denominator = sqrtRatioBX96 * sqrtRatioAX96;

    return numerator / denominator;
  }

  private getAmount1ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
    if (sqrtRatioAX96 > sqrtRatioBX96) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }

    return (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / BigInt(2) ** BigInt(96);
  }

  private calculateFeeGrowthInside(
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
}
