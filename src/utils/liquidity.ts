import { UNISWAP_CONSTANTS } from '../constants/index';

export function getAmountsForLiquidity(
  sqrtPriceX96: bigint,
  sqrtPriceLowerX96: bigint,
  sqrtPriceUpperX96: bigint,
  liquidity: bigint
): { amount0: bigint; amount1: bigint } {
  let amount0: bigint;
  let amount1: bigint;

  if (sqrtPriceX96 <= sqrtPriceLowerX96) {
    // Current price is below the range, position is all in token0
    amount0 = getAmount0ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
    amount1 = 0n;
  } else if (sqrtPriceX96 >= sqrtPriceUpperX96) {
    // Current price is above the range, position is all in token1
    amount0 = 0n;
    amount1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
  } else {
    // Current price is within the range
    amount0 = getAmount0ForLiquidity(sqrtPriceX96, sqrtPriceUpperX96, liquidity);
    amount1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceX96, liquidity);
  }

  return { amount0, amount1 };
}

export function getAmount0ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  const numerator =
    liquidity * UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q96 * (sqrtRatioBX96 - sqrtRatioAX96);
  const denominator = sqrtRatioBX96 * sqrtRatioAX96;

  return numerator / denominator;
}

export function getAmount1ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  return (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q96;
}