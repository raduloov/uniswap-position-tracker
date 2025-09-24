import { PortfolioMetrics, PositionData, PositionMetrics } from "../types";
import { calculateDashboardMetrics } from "../utils/dashboard";
import {
  isPositionInRange,
  calculateFeeDifference,
  calculate24hFees,
  calculateValueChange,
  calculatePriceChange,
  calculateProfitLoss,
  calculateAverageDailyFees,
  calculatePositionAge,
  formatFeeTier
} from "../utils/position";
import {
  buildPositionMap,
  groupPositionsByTimestamp,
  getLatestPositions,
  getPreviousPositions
} from "../utils/positionHistory";

/**
 * Centralized service for calculating all position and portfolio metrics
 * Used by both HTML report generator and Telegram notifier to ensure consistency
 */
export class PositionMetricsCalculator {
  /**
   * Calculate all metrics for a portfolio of positions
   */
  calculatePortfolioMetrics(
    allPositionData: PositionData[],
    currentPositions?: PositionData[],
    previousPositions?: PositionData[]
  ): PortfolioMetrics {
    // If current positions not provided, get them from the data
    if (!currentPositions) {
      const byTimestamp = groupPositionsByTimestamp(allPositionData);
      currentPositions = getLatestPositions(byTimestamp);
      if (!previousPositions) {
        const prev = getPreviousPositions(byTimestamp);
        previousPositions = prev || undefined;
      }
    }

    // Build position history map
    const positionHistoryMap = this.buildPositionHistoryMap(allPositionData);

    // Calculate dashboard metrics
    const dashboard = calculateDashboardMetrics(positionHistoryMap);

    // Calculate total P/L across all positions
    let totalPnL = 0;
    let totalInitialValue = 0;

    for (const [, history] of positionHistoryMap) {
      if (history.length > 0) {
        const pnl = calculateProfitLoss(history);
        totalPnL += pnl.value;

        // Get initial value from the oldest entry
        const oldestEntry = history[history.length - 1];
        if (oldestEntry?.totalValueUSD !== undefined) {
          totalInitialValue += oldestEntry.totalValueUSD;
        }
      }
    }

    const totalPnLPercentage = totalInitialValue > 0 ? (totalPnL / totalInitialValue) * 100 : 0;

    // Calculate 24h fees
    const total24hFees = calculate24hFees(currentPositions, previousPositions);

    // Calculate current totals
    const totalValueUSD = currentPositions.reduce((sum, pos) => sum + (pos.totalValueUSD ?? 0), 0);
    const totalFeesUSD = currentPositions.reduce((sum, pos) => sum + (pos.uncollectedFees.totalUSD ?? 0), 0);

    // Count in/out of range
    let inRangeCount = 0;
    let outOfRangeCount = 0;
    currentPositions.forEach(pos => {
      if (isPositionInRange(pos)) {
        inRangeCount++;
      } else {
        outOfRangeCount++;
      }
    });

    // Get ETH price info (from first position that has it)
    let currentEthPrice: number | null = null;
    let ethPrice24hChange: number | null = null;
    let ethPrice24hChangePercentage: number | null = null;

    const ethPosition = currentPositions.find(p => p.priceRange?.current);
    if (ethPosition?.priceRange?.current) {
      currentEthPrice = ethPosition.priceRange.current;

      // Find previous ETH price
      if (previousPositions && previousPositions.length > 0) {
        const prevEthPosition = previousPositions.find(p => p.priceRange?.current);
        if (prevEthPosition?.priceRange?.current) {
          const priceChange = calculatePriceChange(currentEthPrice, prevEthPosition.priceRange.current);
          ethPrice24hChange = priceChange.difference;
          ethPrice24hChangePercentage = priceChange.percentage;
        }
      }
    }

    // Calculate individual position metrics
    const positionMetrics = this.calculatePositionMetrics(currentPositions, previousPositions, positionHistoryMap);

    return {
      dashboard,
      totalValueUSD,
      totalFeesUSD,
      totalPnL,
      totalPnLPercentage,
      total24hFees,
      inRangeCount,
      outOfRangeCount,
      currentEthPrice,
      ethPrice24hChange,
      ethPrice24hChangePercentage,
      positions: positionMetrics
    };
  }

  /**
   * Calculate metrics for individual positions
   */
  private calculatePositionMetrics(
    currentPositions: PositionData[],
    previousPositions: PositionData[] | undefined,
    positionHistoryMap: Map<string, PositionData[]>
  ): PositionMetrics[] {
    const prevPosMap = previousPositions ? buildPositionMap(previousPositions) : new Map<string, PositionData>();

    return currentPositions.map(position => {
      const prevPosition = prevPosMap.get(position.positionId);
      const history = positionHistoryMap.get(position.positionId) || [];

      // Calculate P/L for this position
      const pnl = history.length > 0 ? calculateProfitLoss(history) : { value: 0, percentage: 0 };

      // Calculate 24h changes
      let value24hChange = 0;
      let value24hChangePercentage = 0;
      let fees24hChange = 0;

      if (prevPosition) {
        const valueChange = calculateValueChange(position.totalValueUSD, prevPosition.totalValueUSD);
        if (valueChange) {
          value24hChange = valueChange.difference;
          value24hChangePercentage = valueChange.percentage;
        }

        const feeDiff = calculateFeeDifference(position, prevPosition);
        if (feeDiff !== null) {
          fees24hChange = feeDiff;
        }
      }

      // Calculate average daily fees
      const averageDailyFees = calculateAverageDailyFees(history);

      // Calculate position age
      const oldestEntry = history.length > 0 ? history[history.length - 1] : position;
      const positionAge = oldestEntry ? calculatePositionAge(oldestEntry.timestamp) : { days: 0, text: "New position" };

      // Price changes
      let price24hChange: number | null = null;
      let price24hChangePercentage: number | null = null;

      if (position.priceRange?.current && prevPosition?.priceRange?.current) {
        const priceChange = calculatePriceChange(position.priceRange.current, prevPosition.priceRange.current);
        price24hChange = priceChange.difference;
        price24hChangePercentage = priceChange.percentage;
      }

      return {
        positionId: position.positionId,
        chain: position.chain,
        poolName: `${position.token0.symbol}/${position.token1.symbol}`,
        feeTier: formatFeeTier(position.fee),
        inRange: isPositionInRange(position),
        currentValue: position.totalValueUSD ?? 0,
        currentFees: position.uncollectedFees.totalUSD ?? 0,
        totalPnL: pnl.value,
        totalPnLPercentage: pnl.percentage,
        value24hChange,
        value24hChangePercentage,
        fees24hChange,
        averageDailyFees,
        positionAge,
        priceRange: position.priceRange || null,
        currentPrice: position.priceRange?.current || null,
        price24hChange,
        price24hChangePercentage
      };
    });
  }

  /**
   * Build position history map from all position data
   */
  private buildPositionHistoryMap(allPositionData: PositionData[]): Map<string, PositionData[]> {
    const positionHistoryMap = new Map<string, PositionData[]>();

    // Group all positions by position ID
    for (const position of allPositionData) {
      const history = positionHistoryMap.get(position.positionId) || [];
      history.push(position);
      positionHistoryMap.set(position.positionId, history);
    }

    // Sort each position's history by timestamp (newest first)
    for (const [, history] of positionHistoryMap) {
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return positionHistoryMap;
  }

  /**
   * Get summary metrics (simplified version for quick access)
   */
  calculateSummaryMetrics(
    currentPositions: PositionData[],
    previousPositions?: PositionData[],
    allPositionData?: PositionData[]
  ): {
    totalValueUSD: number;
    totalFeesUSD: number;
    totalPnL: number;
    totalPnLPercentage: number;
    total24hFees: number;
    inRangeCount: number;
    outOfRangeCount: number;
  } {
    // Build position history if we have all data
    let totalPnL = 0;
    let totalPnLPercentage = 0;

    if (allPositionData) {
      const positionHistoryMap = this.buildPositionHistoryMap(allPositionData);
      let totalInitialValue = 0;

      for (const [, history] of positionHistoryMap) {
        if (history.length > 0) {
          const pnl = calculateProfitLoss(history);
          totalPnL += pnl.value;

          const oldestEntry = history[history.length - 1];
          if (oldestEntry?.totalValueUSD !== undefined) {
            totalInitialValue += oldestEntry.totalValueUSD;
          }
        }
      }

      totalPnLPercentage = totalInitialValue > 0 ? (totalPnL / totalInitialValue) * 100 : 0;
    }

    const total24hFees = calculate24hFees(currentPositions, previousPositions);
    const totalValueUSD = currentPositions.reduce((sum, pos) => sum + (pos.totalValueUSD ?? 0), 0);
    const totalFeesUSD = currentPositions.reduce((sum, pos) => sum + (pos.uncollectedFees.totalUSD ?? 0), 0);

    let inRangeCount = 0;
    let outOfRangeCount = 0;
    currentPositions.forEach(pos => {
      if (isPositionInRange(pos)) {
        inRangeCount++;
      } else {
        outOfRangeCount++;
      }
    });

    return {
      totalValueUSD,
      totalFeesUSD,
      totalPnL,
      totalPnLPercentage,
      total24hFees,
      inRangeCount,
      outOfRangeCount
    };
  }
}
