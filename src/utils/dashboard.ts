import { PositionData } from "../types";
import { calculateProfitLoss } from "./position";

export interface DashboardMetrics {
  totalPnL: number;
  totalFees: number;
  fees24h: number;
  currentEthPrice: number;
  totalValue: number;
  totalFeesChange: number;
  totalValueChange: number;
  ethPriceChange: number;
  totalPnLChange: number;
}

/**
 * Calculate dashboard metrics from position groups
 */
export function calculateDashboardMetrics(positionGroups: Map<string, PositionData[]>): DashboardMetrics {
  let totalPnL = 0;
  let totalFees = 0;
  let fees24h = 0;
  let currentEthPrice = 0;
  let totalValue = 0;
  let ethPriceFound = false;
  let totalInitialValue = 0;

  // Previous values for percentage calculation
  let previousTotalFees = 0;
  let previousTotalValue = 0;
  let previousEthPrice = 0;

  for (const [, positions] of positionGroups) {
    if (positions.length === 0) continue;

    const latestPosition = positions[0];
    if (!latestPosition) continue;

    const previousPosition = positions.length > 1 ? positions[1] : null;
    const oldestPosition = positions[positions.length - 1];

    // Add to total fees
    totalFees += latestPosition.uncollectedFees?.totalUSD || 0;
    if (previousPosition) {
      previousTotalFees += previousPosition.uncollectedFees?.totalUSD || 0;
    }

    // Add to total value
    totalValue += latestPosition.totalValueUSD || 0;
    if (previousPosition) {
      previousTotalValue += previousPosition.totalValueUSD || 0;
    }

    // Add initial value from the first recorded position
    if (oldestPosition) {
      totalInitialValue += oldestPosition.totalValueUSD || 0;
    }

    // Calculate 24h fee difference
    const currentFees = latestPosition.uncollectedFees?.totalUSD || 0;
    const previousFees = previousPosition?.uncollectedFees?.totalUSD || 0;
    fees24h += currentFees - previousFees;

    // Calculate P&L for this position
    const positionPnL = calculateProfitLoss(positions);
    totalPnL += positionPnL.value;

    // Try to extract ETH price from WETH/USDT or similar pools
    if (!ethPriceFound && isEthPool(latestPosition)) {
      currentEthPrice = latestPosition.priceRange?.current || 0;
      if (previousPosition) {
        previousEthPrice = previousPosition.priceRange?.current || 0;
      }
      ethPriceFound = true;
    }
  }

  // Calculate percentage changes
  const totalFeesChange = previousTotalFees > 0 ? ((totalFees - previousTotalFees) / previousTotalFees) * 100 : 0;
  // Calculate total value change from initial investment (not 24h change)
  const totalValueChange = totalInitialValue > 0 ? ((totalValue - totalInitialValue) / totalInitialValue) * 100 : 0;
  const ethPriceChange = previousEthPrice > 0 ? ((currentEthPrice - previousEthPrice) / previousEthPrice) * 100 : 0;

  // Calculate P&L percentage based on initial investment (first positions' total values)
  // P&L % = (Total P&L / Total Initial Value) * 100
  const totalPnLChange = totalInitialValue > 0 ? (totalPnL / totalInitialValue) * 100 : 0;

  return {
    totalPnL,
    totalFees,
    fees24h,
    currentEthPrice,
    totalValue,
    totalFeesChange,
    totalValueChange,
    ethPriceChange,
    totalPnLChange
  };
}

/**
 * Check if a position is an ETH pool (contains ETH/WETH and a stablecoin)
 */
function isEthPool(position: PositionData): boolean {
  const symbols = [position.token0.symbol, position.token1.symbol];
  const hasEth = symbols.some(symbol =>
    symbol.toLowerCase().includes('weth') ||
    symbol.toLowerCase().includes('eth')
  );
  const hasStablecoin = symbols.some(symbol =>
    ['USDT', 'USDC', 'DAI', 'BUSD', 'FRAX'].includes(symbol.toUpperCase())
  );
  return hasEth && hasStablecoin;
}