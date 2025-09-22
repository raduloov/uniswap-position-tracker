import { GRAPH_CONSTANTS } from "../constants";
import { Chain } from "../types";

// For Ethereum, tickLower/tickUpper are objects with nested fields
// For Arbitrum, they are simple string values and we need to query ticks separately
const getPositionFields = (chain?: Chain) => {
  // Arbitrum subgraph doesn't include fee growth data in tickLower/tickUpper
  // We'll need to query tick entities separately if needed
  const tickFields =
    chain === Chain.ARBITRUM
      ? `tickLower
    tickUpper`
      : `tickLower {
      tickIdx
      feeGrowthOutside0X128
      feeGrowthOutside1X128
    }
    tickUpper {
      tickIdx
      feeGrowthOutside0X128
      feeGrowthOutside1X128
    }`;

  return `
    id
    owner
    liquidity
    ${tickFields}
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
};

export const buildPositionByIdQuery = (positionId: string, chain?: Chain): string => {
  return `
    {
      positions(where: { id: "${positionId}" }) {
        ${getPositionFields(chain)}
      }
    }
  `;
};

export const buildPositionsByOwnerQuery = (walletAddress: string, chain?: Chain): string => {
  return `
    {
      positions(
        where: { owner: "${walletAddress.toLowerCase()}", liquidity_gt: 0 }
        first: ${GRAPH_CONSTANTS.QUERY_LIMITS.MAX_POSITIONS}
        orderBy: liquidity
        orderDirection: desc
      ) {
        ${getPositionFields(chain)}
      }
    }
  `;
};

// Query to get tick data for Arbitrum positions (if needed for accurate fee calculation)
export const buildTickQuery = (poolId: string, tickIdx: string): string => {
  return `
    {
      tick(id: "${poolId}#${tickIdx}") {
        tickIdx
        feeGrowthOutside0X128
        feeGrowthOutside1X128
      }
    }
  `;
};
