/**
 * Format currency values
 */
export function formatCurrency(value: number, options?: { showSign?: boolean }): string {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  let result = `$${formatted}`;
  
  if (value < 0) {
    result = `-${result}`;
  } else if (options?.showSign && value > 0) {
    result = `+${result}`;
  }
  
  return result;
}

/**
 * Format date for display
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
 * Format percentage change
 */
export function formatPercentage(value: number, options?: { showSign?: boolean }): string {
  const formatted = value.toFixed(2);

  if (options?.showSign && value >= 0) {
    return `+${formatted}%`;
  }

  return `${formatted}%`;
}

/**
 * Format percentage with CSS class for styling
 */
export function formatPercentageWithClass(value: number): { text: string; class: string } {
  const sign = value >= 0 ? '+' : '-';
  const absValue = Math.abs(value);
  const className = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  return {
    text: value === 0 ? '0.00%' : `${sign}${absValue.toFixed(2)}%`,
    class: className
  };
}

// HTML-specific formatting functions
export const htmlFormatters = {
  /**
   * Format fee difference for HTML display
   */
  formatFeeDifference(difference: number | null): string {
    if (difference === null) {
      return '<span style="color: #718096;">-</span>';
    }
    const className = difference < 0 ? 'fees-24h-negative' : 'fees-24h';
    return `<span class="${className}">${formatCurrency(difference, { showSign: true })}</span>`;
  },

  /**
   * Format total value with percentage change for HTML
   */
  formatTotalValueWithChange(
    value: number | undefined,
    percentageChange: number | null = null
  ): string {
    const baseValue = `<strong>${formatCurrency(value || 0)}</strong>`;
    
    if (percentageChange === null || Math.abs(percentageChange) < 0.01) {
      return baseValue;
    }
    
    const className = percentageChange >= 0 ? "price-change-positive" : "price-change-negative";
    return `${baseValue} <span class="${className}">(${formatPercentage(percentageChange, { showSign: true })})</span>`;
  },

  /**
   * Format price with percentage change for HTML
   */
  formatPriceWithChange(
    price: number | undefined,
    percentageChange: number | null = null
  ): string {
    if (!price) {
      return "N/A";
    }
    
    const basePrice = formatCurrency(price);
    
    if (percentageChange === null || Math.abs(percentageChange) < 0.01) {
      return basePrice;
    }
    
    const className = percentageChange >= 0 ? "price-change-positive" : "price-change-negative";
    return `${basePrice} <span class="${className}">(${formatPercentage(percentageChange, { showSign: true })})</span>`;
  },

  /**
   * Format status badge for HTML
   */
  formatStatusBadge(isInRange: boolean): string {
    return isInRange
      ? '<span class="status-badge status-in-range">In Range</span>'
      : '<span class="status-badge status-out-range">Out of Range</span>';
  }
};