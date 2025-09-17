import { GRAPH_CONSTANTS } from "../constants";

export const positionFields = `
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

export const buildPositionByIdQuery = (positionId: string): string => {
  return `
    {
      positions(where: { id: "${positionId}" }) {
        ${positionFields}
      }
    }
  `;
};

export const buildPositionsByOwnerQuery = (walletAddress: string): string => {
  return `
    {
      positions(
        where: { owner: "${walletAddress.toLowerCase()}", liquidity_gt: 0 }
        first: ${GRAPH_CONSTANTS.QUERY_LIMITS.MAX_POSITIONS}
        orderBy: liquidity
        orderDirection: desc
      ) {
        ${positionFields}
      }
    }
  `;
};
