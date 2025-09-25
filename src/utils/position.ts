import { PositionData } from "../types";
import { formatPercentage } from "./formatting";

/**
 * Check if a position is in range
 */
export function isPositionInRange(position: PositionData): boolean {
  // Check using priceRange if available (preferred)
  if (position.priceRange) {
    return (
      position.priceRange.current >= position.priceRange.lower &&
      position.priceRange.current <= position.priceRange.upper
    );
  }

  // Fallback to tick-based check
  if (position.pool && position.pool.currentTick !== undefined) {
    return position.pool.currentTick >= position.tickLower && position.pool.currentTick < position.tickUpper;
  }

  return false;
}

/**
 * Calculate fee difference between two positions
 */
export function calculateFeeDifference(
  currentPosition: PositionData,
  previousPosition: PositionData | null
): number | null {
  if (!previousPosition) return null;

  const currentFees = currentPosition.uncollectedFees?.totalUSD ?? 0;
  const previousFees = previousPosition.uncollectedFees?.totalUSD ?? 0;

  return currentFees - previousFees;
}

/**
 * Calculate 24h fees for multiple positions
 */
export function calculate24hFees(currentPositions: PositionData[], previousPositions?: PositionData[]): number {
  if (!previousPositions) return 0;

  let total24hFees = 0;
  const prevPosMap = new Map<string, PositionData>();

  for (const pos of previousPositions) {
    prevPosMap.set(pos.positionId, pos);
  }

  for (const currentPos of currentPositions) {
    const prevPos = prevPosMap.get(currentPos.positionId);
    if (prevPos) {
      const feeDiff = calculateFeeDifference(currentPos, prevPos);
      if (feeDiff !== null) {
        total24hFees += feeDiff;
      }
    }
  }

  return total24hFees;
}

/**
 * Calculate value change between positions
 */
export function calculateValueChange(
  currentValue: number | undefined,
  previousValue: number | undefined
): { difference: number; percentage: number } | null {
  if (!currentValue || !previousValue || previousValue === 0) {
    return null;
  }

  const difference = currentValue - previousValue;
  const percentage = (difference / previousValue) * 100;

  return { difference, percentage };
}

/**
 * Calculate price change
 */
export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): {
  difference: number;
  percentage: number;
  emoji: string;
  formatted: string;
} {
  const difference = currentPrice - previousPrice;
  const percentage = previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
  const emoji = percentage >= 0 ? "📈" : "📉";
  const formatted = `${emoji} ${formatPercentage(percentage, { showSign: true })}`;

  return {
    difference,
    percentage,
    emoji,
    formatted
  };
}

/**
 * Calculate profit/loss for a position history
 * @param positions - Array of position data, with the first element being the most recent/live position
 */
export function calculateProfitLoss(positions: PositionData[]): {
  value: number;
  percentage: number;
} {
  if (positions.length === 0) {
    return { value: 0, percentage: 0 };
  }

  // For P/L calculation:
  // - latest (positions[0]) is the current/live position
  // - oldest (positions[positions.length - 1]) is the first tracked position
  const latest = positions[0];
  const oldest = positions[positions.length - 1];

  if (!latest || !oldest) {
    return { value: 0, percentage: 0 };
  }

  // Simple P/L calculation:
  // P/L = (Current Position Total Value - Initial Position Total Value) + Current Uncollected Fees
  // This assumes initial position had no fees (or they were negligible)

  const currentValue = latest.totalValueUSD || 0;
  const initialValue = oldest.totalValueUSD || 0;
  const currentFees = latest.uncollectedFees?.totalUSD || 0;

  // Total profit/loss = value change + current uncollected fees
  const totalProfitLoss = (currentValue - initialValue) + currentFees;

  // Calculate percentage based on initial investment (first position total value)
  // P/L % = (Total P/L / Initial Value) * 100
  const percentage = initialValue > 0 ? (totalProfitLoss / initialValue) * 100 : 0;

  return { value: totalProfitLoss, percentage };
}

/**
 * Calculate average daily fees from position history
 */
export function calculateAverageDailyFees(positions: PositionData[]): number {
  let totalFees = 0;
  let feeCount = 0;

  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    const previousPosition = i < positions.length - 1 ? positions[i + 1] : null;

    if (position && previousPosition) {
      const feeDiff = calculateFeeDifference(position, previousPosition);
      if (feeDiff !== null && feeDiff > 0) {
        totalFees += feeDiff;
        feeCount++;
      }
    }
  }

  return feeCount > 0 ? totalFees / feeCount : 0;
}

/**
 * Calculate position age in days
 */
export function calculatePositionAge(oldestTimestamp: string): {
  days: number;
  text: string;
} {
  const oldestDate = new Date(oldestTimestamp);
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageText = ageInDays === 0 ? "New position" : ageInDays === 1 ? "1 day old" : `${ageInDays} days old`;

  return { days: ageInDays, text: ageText };
}

/**
 * Format fee tier from basis points to percentage
 */
export function formatFeeTier(fee: number): number {
  return fee / 10000;
}
