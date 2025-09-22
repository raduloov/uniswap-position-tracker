import { config } from "../config";
import { GRAPH_CONSTANTS, UNISWAP_CONSTANTS } from "../constants";
import { Chain } from "../types";

export const isGithubActionsEnv = !!process.env["GITHUB_ACTIONS"];

export const getGraphEndpoint = (chain: Chain) => {
  const template =
    chain === Chain.ARBITRUM
      ? GRAPH_CONSTANTS.ENDPOINTS.ARBITRUM.DECENTRALIZED_TEMPLATE
      : GRAPH_CONSTANTS.ENDPOINTS.ETHEREUM.DECENTRALIZED_TEMPLATE;
  return template.replace(GRAPH_CONSTANTS.ENDPOINTS.API_KEY_PLACEHOLDER, config.graphApiKey);
};

export const getSqrtPriceX96FromTick = (tick: number): bigint => {
  const absTick = tick < 0 ? -tick : tick;
  let ratio =
    (absTick & 0x1) !== 0 ? UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x1] : UNISWAP_CONSTANTS.HEX_VALUES.BASE_RATIO;

  if ((absTick & 0x2) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x2]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x4) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x4]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x8) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x8]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x10) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x10]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x20) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x20]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x40) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x40]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x80) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x80]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x100) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x100]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x200) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x200]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x400) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x400]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x800) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x800]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x1000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x1000]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x2000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x2000]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x4000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x4000]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x8000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x8000]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x10000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x10000]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x20000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x20000]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x40000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x40000]) >> UNISWAP_CONSTANTS.MATH.Q128;
  if ((absTick & 0x80000) !== 0)
    ratio = (ratio * UNISWAP_CONSTANTS.HEX_VALUES.TICK_SPACING[0x80000]) >> UNISWAP_CONSTANTS.MATH.Q128;

  if (tick > 0) ratio = (UNISWAP_CONSTANTS.MATH.TWO ** UNISWAP_CONSTANTS.MATH.Q256 - BigInt(1)) / ratio;

  // Shift right by 32 to get sqrtPriceX96
  return ratio >> UNISWAP_CONSTANTS.MATH.Q32;
};

// Convert number to padded hex (32 bytes)
export const toHex32 = (num: number): string => {
  // Convert to hex and pad to 64 characters (32 bytes)
  const hex = num < 0 ? (BigInt(2) ** BigInt(256) + BigInt(num)).toString(16) : num.toString(16);
  return hex.padStart(64, "0");
};

// Decode uint256 from hex string
export const decodeUint256 = (hex: string): string => {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  // Convert to BigInt and then to string
  return BigInt("0x" + cleanHex).toString();
};
