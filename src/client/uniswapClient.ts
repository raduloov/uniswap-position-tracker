import { getSqrtPriceX96FromTick } from "../utils/index";
import axios from "axios";
import { Chain, GraphQLPosition, PositionData } from "../types";
import { UNISWAP_CONSTANTS, STABLECOIN_SYMBOLS } from "../constants";
import { getGraphEndpoint } from "../utils";
import { buildPositionByIdQuery, buildPositionsByOwnerQuery } from "../schemas";
import { ArbitrumFeeFetcher } from "../services/arbitrumFeeFetcher";

class UniswapClient {
  private chain: Chain;
  private arbitrumFeeFetcher: ArbitrumFeeFetcher | null = null;

  constructor(chain: Chain) {
    this.chain = chain;
    if (chain === Chain.ARBITRUM) {
      // The Graph on Arbitrum does not provide full tick data needed for fee calculations
      // So we need to fetch tick data directly from the Arbitrum RPC
      this.arbitrumFeeFetcher = new ArbitrumFeeFetcher();
    }
  }

  async getPositions(walletAddress: string, positionId?: string, timestamp?: string): Promise<PositionData[]> {
    try {
      const chainParam = this.chain;
      const query = positionId
        ? buildPositionByIdQuery(positionId, chainParam)
        : buildPositionsByOwnerQuery(walletAddress, chainParam);
      const subgraphUrl = getGraphEndpoint(this.chain);

      const response = await axios.post(
        subgraphUrl,
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
        return [];
      }

      const positions: GraphQLPosition[] = response.data.data?.positions;

      if (!positions || positions.length === 0) {
        return [];
      }

      return Promise.all(positions.map(pos => this.transformPosition(pos, this.chain, timestamp)));
    } catch (error: any) {
      return [];
    }
  }

  private async transformPosition(pos: GraphQLPosition, chain: Chain, timestamp?: string): Promise<PositionData> {
    // Get decimals
    const decimals0 = parseInt(pos.token0.decimals);
    const decimals1 = parseInt(pos.token1.decimals);

    // Parse tick values - handle both Ethereum (object) and Arbitrum (string) formats
    const tickLower = typeof pos.tickLower === "string" ? parseInt(pos.tickLower) : parseInt(pos.tickLower.tickIdx);
    const tickUpper = typeof pos.tickUpper === "string" ? parseInt(pos.tickUpper) : parseInt(pos.tickUpper.tickIdx);
    const currentTick = parseInt(pos.pool.tick);

    // Calculate sqrt prices
    const sqrtPriceX96 = BigInt(pos.pool.sqrtPrice);
    const sqrtPriceLowerX96 = getSqrtPriceX96FromTick(tickLower);
    const sqrtPriceUpperX96 = getSqrtPriceX96FromTick(tickUpper);

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
    const token0IsStable = STABLECOIN_SYMBOLS.includes(pos.token0.symbol.toUpperCase() as any);
    const token1IsStable = STABLECOIN_SYMBOLS.includes(pos.token1.symbol.toUpperCase() as any);

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

    // Calculate uncollected fees
    let uncollectedFees0 = 0;
    let uncollectedFees1 = 0;

    // Calculate price per unit for fee USD calculations
    let pricePerToken0 = 0;
    let pricePerToken1 = 0;

    if (token0IsStable) {
      pricePerToken0 = 1;
      pricePerToken1 = token1PriceInToken0;
    } else if (token1IsStable) {
      pricePerToken0 = token0PriceInToken1;
      pricePerToken1 = 1;
    } else {
      // Neither is stable, use exchange rate
      pricePerToken0 = token0PriceInToken1;
      pricePerToken1 = 1;
    }

    // Handle fee data fetching based on chain
    const isArbitrum = chain === Chain.ARBITRUM;

    let tickLowerFeeGrowth0 = "0";
    let tickLowerFeeGrowth1 = "0";
    let tickUpperFeeGrowth0 = "0";
    let tickUpperFeeGrowth1 = "0";

    if (isArbitrum && this.arbitrumFeeFetcher) {
      // For Arbitrum without Zerion, fetch tick data via RPC
      const tickData = await this.arbitrumFeeFetcher.fetchTickData(pos.pool.id, tickLower, tickUpper);
      tickLowerFeeGrowth0 = tickData.tickLower.feeGrowthOutside0X128;
      tickLowerFeeGrowth1 = tickData.tickLower.feeGrowthOutside1X128;
      tickUpperFeeGrowth0 = tickData.tickUpper.feeGrowthOutside0X128;
      tickUpperFeeGrowth1 = tickData.tickUpper.feeGrowthOutside1X128;
    } else if (!isArbitrum) {
      // Ethereum has full tick data with fee growth inline
      const tickLowerData = typeof pos.tickLower === "string" ? null : pos.tickLower;
      const tickUpperData = typeof pos.tickUpper === "string" ? null : pos.tickUpper;
      tickLowerFeeGrowth0 = tickLowerData?.feeGrowthOutside0X128 || "0";
      tickLowerFeeGrowth1 = tickLowerData?.feeGrowthOutside1X128 || "0";
      tickUpperFeeGrowth0 = tickUpperData?.feeGrowthOutside0X128 || "0";
      tickUpperFeeGrowth1 = tickUpperData?.feeGrowthOutside1X128 || "0";
    }

    // Calculate fees if we have the data

    if (tickLowerFeeGrowth0 !== "0" || tickUpperFeeGrowth0 !== "0") {
      const feeGrowthInside0 = this.calculateFeeGrowthInside(
        BigInt(pos.pool.feeGrowthGlobal0X128 || "0"),
        BigInt(tickLowerFeeGrowth0),
        BigInt(tickUpperFeeGrowth0),
        tickLower,
        tickUpper,
        currentTick
      );

      const feeGrowthInside1 = this.calculateFeeGrowthInside(
        BigInt(pos.pool.feeGrowthGlobal1X128 || "0"),
        BigInt(tickLowerFeeGrowth1),
        BigInt(tickUpperFeeGrowth1),
        tickLower,
        tickUpper,
        currentTick
      );

      // Calculate fees owed
      const feeGrowthInside0LastX128 = BigInt(pos.feeGrowthInside0LastX128 || "0");
      const feeGrowthInside1LastX128 = BigInt(pos.feeGrowthInside1LastX128 || "0");

      const uncollectedFees0Big =
        (liquidity * (feeGrowthInside0 - feeGrowthInside0LastX128)) /
        UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q128;
      const uncollectedFees1Big =
        (liquidity * (feeGrowthInside1 - feeGrowthInside1LastX128)) /
        UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q128;

      // Convert to decimal amounts
      uncollectedFees0 = Number(uncollectedFees0Big) / Math.pow(10, decimals0);
      uncollectedFees1 = Number(uncollectedFees1Big) / Math.pow(10, decimals1);
    } else {
      // No fee data available (Arbitrum with Zerion will handle this separately)
      uncollectedFees0 = 0;
      uncollectedFees1 = 0;
    }

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
    const priceRatioLower = Math.pow(UNISWAP_CONSTANTS.MATH.TICK_BASE, -ticksToLower);
    const priceRatioUpper = Math.pow(UNISWAP_CONSTANTS.MATH.TICK_BASE, ticksToUpper);

    if (currentWETHPrice > 0 && !isNaN(currentWETHPrice) && !isNaN(priceRatioLower) && !isNaN(priceRatioUpper)) {
      if (token1IsStable) {
        // Show WETH price range in USDT
        priceRange = {
          lower: currentWETHPrice * priceRatioLower,
          upper: currentWETHPrice * priceRatioUpper,
          current: currentWETHPrice,
          currency: pos.token1.symbol
        };
      } else if (token0IsStable && token1PriceInToken0 > 0) {
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
    }

    const now = timestamp || new Date().toISOString();
    const dateObj = new Date(now);
    
    return {
      timestamp: now,
      date: dateObj.toLocaleDateString(),
      positionId: pos.id,
      owner: pos.owner,
      chain,
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
        token0USD: uncollectedFees0 * pricePerToken0,
        token1USD: uncollectedFees1 * pricePerToken1,
        totalUSD: uncollectedFees0 * pricePerToken0 + uncollectedFees1 * pricePerToken1
      },
      totalValueUSD: !isNaN(token0USD) && !isNaN(token1USD) ? token0USD + token1USD : 0,
      pool: {
        address: pos.pool.id,
        currentTick: currentTick,
        sqrtPriceX96: pos.pool.sqrtPrice
      },
      ...(priceRange && { priceRange })
    };
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

    const numerator =
      liquidity * UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q96 * (sqrtRatioBX96 - sqrtRatioAX96);
    const denominator = sqrtRatioBX96 * sqrtRatioAX96;

    return numerator / denominator;
  }

  private getAmount1ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
    if (sqrtRatioAX96 > sqrtRatioBX96) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }

    return (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q96;
  }

  // TODO: Understand and verify this calculation
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

export default UniswapClient;
