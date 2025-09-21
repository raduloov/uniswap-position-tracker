import { PositionData } from "../types";
import { isPositionInRange, calculateProfitLoss } from "./position";
import { buildPositionGroups } from "./positionHistory";

export interface PortfolioSummary {
  totalValueUSD: number;
  totalFeesUSD: number;
  inRangeCount: number;
  outOfRangeCount: number;
  profitLoss: number;
  profitLossPercentage: number;
}

/**
 * Calculates a complete portfolio summary including P/L
 */
export function calculatePortfolioSummary(
  positions: PositionData[],
  baselinePositions?: PositionData[]
): PortfolioSummary {
  let totalValueUSD = 0;
  let totalFeesUSD = 0;
  let inRangeCount = 0;
  let outOfRangeCount = 0;

  // Calculate totals and range status
  for (const position of positions) {
    totalValueUSD += position.totalValueUSD ?? 0;
    totalFeesUSD += position.uncollectedFees.totalUSD ?? 0;

    // Count in/out of range
    if (isPositionInRange(position)) {
      inRangeCount++;
    } else {
      outOfRangeCount++;
    }
  }

  // Calculate P/L using baseline positions
  let profitLoss = 0;
  let profitLossPercentage = 0;

  if (baselinePositions && baselinePositions.length > 0) {
    // Build position groups for P/L calculation
    const positionGroups = buildPositionGroups(positions, baselinePositions);

    // Calculate total P/L across all positions
    for (const [, positionHistory] of positionGroups) {
      if (positionHistory.length > 0) {
        const pnl = calculateProfitLoss(positionHistory);
        profitLoss += pnl.value;
      }
    }

    // Calculate overall percentage
    const baselineTotalValue = baselinePositions.reduce((sum, pos) => sum + (pos.totalValueUSD ?? 0), 0);
    profitLossPercentage = baselineTotalValue > 0 ? (profitLoss / baselineTotalValue) * 100 : 0;
  }

  return {
    totalValueUSD,
    totalFeesUSD,
    inRangeCount,
    outOfRangeCount,
    profitLoss,
    profitLossPercentage
  };
}

/**
 * Calculates just the range status counts
 */
export function calculateRangeStatus(positions: PositionData[]): {
  inRangeCount: number;
  outOfRangeCount: number;
} {
  let inRangeCount = 0;
  let outOfRangeCount = 0;

  for (const position of positions) {
    if (isPositionInRange(position)) {
      inRangeCount++;
    } else {
      outOfRangeCount++;
    }
  }

  return { inRangeCount, outOfRangeCount };
}

/**
 * Calculates total P/L across position groups
 */
export function calculateTotalPnL(positionGroups: Map<string, PositionData[]>): {
  totalPnL: number;
  totalPercentage: number;
  byPosition: Map<string, { value: number; percentage: number }>;
} {
  let totalPnL = 0;
  const byPosition = new Map<string, { value: number; percentage: number }>();

  for (const [positionId, positionHistory] of positionGroups) {
    if (positionHistory.length > 0) {
      const pnl = calculateProfitLoss(positionHistory);
      totalPnL += pnl.value;
      byPosition.set(positionId, pnl);
    }
  }

  // Calculate overall percentage based on initial values
  let totalInitialValue = 0;
  for (const [, positionHistory] of positionGroups) {
    if (positionHistory.length > 0) {
      const oldest = positionHistory[positionHistory.length - 1];
      totalInitialValue += oldest?.totalValueUSD ?? 0;
    }
  }

  const totalPercentage = totalInitialValue > 0 ? (totalPnL / totalInitialValue) * 100 : 0;

  return {
    totalPnL,
    totalPercentage,
    byPosition
  };
}