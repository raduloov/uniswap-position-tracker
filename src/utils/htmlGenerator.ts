import { PositionData } from "../types";

/**
 * Calculate the fee difference between current and previous position
 * @param currentPosition The current position data
 * @param previousPosition The previous position data (can be null)
 * @returns The fee difference or null if cannot be calculated
 */
export function calculateFeeDifference(
  currentPosition: PositionData,
  previousPosition: PositionData | null
): number | null {
  if (
    !previousPosition ||
    !previousPosition.uncollectedFees?.totalUSD ||
    !currentPosition.uncollectedFees?.totalUSD
  ) {
    return null;
  }
  return currentPosition.uncollectedFees.totalUSD - previousPosition.uncollectedFees.totalUSD;
}

/**
 * Calculate the total value difference and percentage change
 * @param currentValue The current total value in USD
 * @param previousValue The previous total value in USD
 * @returns Object with difference and percentage change, or null if cannot be calculated
 */
export function calculateTotalValueDifference(
  currentValue: number | undefined,
  previousValue: number | undefined
): { difference: number; percentageChange: number } | null {
  if (!currentValue || !previousValue || previousValue === 0) {
    return null;
  }
  const difference = currentValue - previousValue;
  const percentageChange = (difference / previousValue) * 100;
  return { difference, percentageChange };
}

/**
 * Calculate the price difference and percentage change
 * @param currentPrice The current price
 * @param previousPrice The previous price
 * @returns Object with difference and percentage change, or null if cannot be calculated
 */
export function calculatePriceDifference(
  currentPrice: number | undefined,
  previousPrice: number | undefined
): { difference: number; percentageChange: number } | null {
  if (!currentPrice || !previousPrice || previousPrice === 0) {
    return null;
  }
  const difference = currentPrice - previousPrice;
  const percentageChange = (difference / previousPrice) * 100;
  return { difference, percentageChange };
}

/**
 * Format a fee difference for display
 * @param difference The fee difference value
 * @returns Formatted HTML string for fee difference
 */
export function formatFeeDifference(difference: number | null): string {
  if (difference === null) {
    return '<span style="color: #718096;">-</span>';
  }
  const sign = difference >= 0 ? "+" : "";
  return `<span class="fees-24h">${sign}$${Math.abs(difference).toFixed(2)}</span>`;
}

/**
 * Format a total value with percentage change for display
 * @param value The current value
 * @param percentageChange The percentage change (optional)
 * @returns Formatted HTML string for total value
 */
export function formatTotalValueWithChange(
  value: number | undefined,
  percentageChange: number | null = null
): string {
  const baseValue = `<strong>$${value?.toFixed(2) || "0.00"}</strong>`;
  
  if (percentageChange === null || Math.abs(percentageChange) < 0.01) {
    return baseValue;
  }
  
  const sign = percentageChange >= 0 ? "+" : "";
  const className = percentageChange >= 0 ? "price-change-positive" : "price-change-negative";
  return `${baseValue} <span class="${className}">(${sign}${percentageChange.toFixed(2)}%)</span>`;
}

/**
 * Format a price with percentage change for display
 * @param price The current price
 * @param percentageChange The percentage change (optional)
 * @returns Formatted HTML string for price
 */
export function formatPriceWithChange(
  price: number | undefined,
  percentageChange: number | null = null
): string {
  if (!price) {
    return "N/A";
  }
  
  const basePrice = `$${price.toFixed(2)}`;
  
  if (percentageChange === null || Math.abs(percentageChange) < 0.01) {
    return basePrice;
  }
  
  const sign = percentageChange >= 0 ? "+" : "";
  const className = percentageChange >= 0 ? "price-change-positive" : "price-change-negative";
  return `${basePrice} <span class="${className}">(${sign}${percentageChange.toFixed(2)}%)</span>`;
}

/**
 * Check if a position is in range
 * @param position The position data
 * @returns True if the position is in range, false otherwise
 */
export function isPositionInRange(position: PositionData): boolean {
  if (!position.priceRange) {
    return false;
  }
  return (
    position.priceRange.current >= position.priceRange.lower &&
    position.priceRange.current <= position.priceRange.upper
  );
}

/**
 * Format a status badge for display
 * @param isInRange Whether the position is in range
 * @returns Formatted HTML string for status badge
 */
export function formatStatusBadge(isInRange: boolean): string {
  return isInRange
    ? '<span class="status-badge status-in-range">In Range</span>'
    : '<span class="status-badge status-out-range">Out of Range</span>';
}

/**
 * Calculate position age in days
 * @param oldestTimestamp The oldest position timestamp
 * @returns Object with age in days and formatted text
 */
export function calculatePositionAge(oldestTimestamp: string): { days: number; text: string } {
  const oldestDate = new Date(oldestTimestamp);
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageText = ageInDays === 0 ? "New position" : ageInDays === 1 ? "1 day old" : `${ageInDays} days old`;
  return { days: ageInDays, text: ageText };
}

/**
 * Format a date for display in the table
 * @param timestamp The timestamp to format
 * @param timezone The timezone to use for formatting
 * @returns Formatted date string
 */
export function formatTableDate(timestamp: string, timezone: string): string {
  const date = new Date(timestamp);
  const dateStr = date
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: timezone
    })
    .toUpperCase();
  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone
  });
  return `${dateStr}, ${timeStr}`;
}

/**
 * Calculate average daily fees from position history
 * @param positions Array of position data sorted by date (newest first)
 * @returns Average daily fees in USD
 */
export function calculateAverageDailyFees(positions: PositionData[]): number {
  let totalFees = 0;
  let feeCount = 0;
  
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    const previousPosition = i < positions.length - 1 ? positions[i + 1] : null;
    
    if (position && previousPosition && 
        position.uncollectedFees.totalUSD !== undefined && 
        previousPosition.uncollectedFees.totalUSD !== undefined) {
      const feeDiff = position.uncollectedFees.totalUSD - previousPosition.uncollectedFees.totalUSD;
      if (feeDiff > 0) {
        totalFees += feeDiff;
        feeCount++;
      }
    }
  }
  
  return feeCount > 0 ? totalFees / feeCount : 0;
}