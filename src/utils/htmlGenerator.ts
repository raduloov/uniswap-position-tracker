import { 
  isPositionInRange as checkPositionInRange,
  calculateFeeDifference as calcFeeDifference,
  calculateValueChange,
  calculateProfitLoss as calcProfitLoss,
  calculateAverageDailyFees as calcAverageDailyFees,
  calculatePositionAge as calcPositionAge
} from "./position";
import { formatTableDate as formatDate, htmlFormatters } from "./formatting";

// Re-export for backward compatibility
export const calculateFeeDifference = calcFeeDifference;

// Re-export with renamed properties for backward compatibility
export function calculateTotalValueDifference(
  currentValue: number | undefined,
  previousValue: number | undefined
): { difference: number; percentageChange: number } | null {
  const result = calculateValueChange(currentValue, previousValue);
  if (!result) return null;
  return { difference: result.difference, percentageChange: result.percentage };
}

// Re-export with renamed properties for backward compatibility
export function calculatePriceDifference(
  currentPrice: number | undefined,
  previousPrice: number | undefined
): { difference: number; percentageChange: number } | null {
  const result = calculateValueChange(currentPrice, previousPrice);
  if (!result) return null;
  return { difference: result.difference, percentageChange: result.percentage };
}

// Re-export from htmlFormatters
export const formatFeeDifference = htmlFormatters.formatFeeDifference;

// Re-export from htmlFormatters
export const formatTotalValueWithChange = htmlFormatters.formatTotalValueWithChange;

// Re-export from htmlFormatters
export const formatPriceWithChange = htmlFormatters.formatPriceWithChange;

// Re-export from position utils
export const isPositionInRange = checkPositionInRange;

// Re-export from htmlFormatters
export const formatStatusBadge = htmlFormatters.formatStatusBadge;

// Re-export from position utils
export const calculatePositionAge = calcPositionAge;

// Re-export from formatting utils
export const formatTableDate = formatDate;

// Re-export from position utils
export const calculateAverageDailyFees = calcAverageDailyFees;

// Re-export from position utils
export const calculateProfitLoss = calcProfitLoss;