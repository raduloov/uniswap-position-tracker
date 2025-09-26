import {
  formatCurrency,
  formatTableDate,
  formatPercentage,
  formatPercentageWithClass,
  htmlFormatters
} from '../../src/utils/formatting';

describe('formatCurrency', () => {
  it('should format positive numbers', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0.5)).toBe('$0.50');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('should format negative numbers', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    expect(formatCurrency(-0.5)).toBe('-$0.50');
  });

  it('should format with sign when requested', () => {
    expect(formatCurrency(1234.56, { showSign: true })).toBe('+$1,234.56');
    expect(formatCurrency(-1234.56, { showSign: true })).toBe('-$1,234.56');
    expect(formatCurrency(0, { showSign: true })).toBe('$0.00');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatTableDate', () => {
  it('should format date with timezone', () => {
    const timestamp = '2024-01-15T14:30:00Z';
    const result = formatTableDate(timestamp, 'UTC');
    expect(result).toMatch(/^MON, JAN 15, 14:30$/);
  });

  it('should handle different timezones', () => {
    const timestamp = '2024-01-15T14:30:00Z';
    const resultUTC = formatTableDate(timestamp, 'UTC');
    const resultEST = formatTableDate(timestamp, 'America/New_York');
    expect(resultUTC).not.toBe(resultEST);
  });
});

describe('formatPercentage', () => {
  it('should format positive percentages', () => {
    expect(formatPercentage(12.345)).toBe('12.35%');
    expect(formatPercentage(0.5)).toBe('0.50%');
    expect(formatPercentage(100)).toBe('100.00%');
  });

  it('should format negative percentages', () => {
    expect(formatPercentage(-12.345)).toBe('-12.35%');
    expect(formatPercentage(-0.5)).toBe('-0.50%');
  });

  it('should format with sign when requested', () => {
    expect(formatPercentage(12.345, { showSign: true })).toBe('+12.35%');
    expect(formatPercentage(-12.345, { showSign: true })).toBe('-12.35%');
    expect(formatPercentage(0, { showSign: true })).toBe('+0.00%');
  });
});

describe('formatPercentageWithClass', () => {
  it('should format positive percentages with class', () => {
    const result = formatPercentageWithClass(12.345);
    expect(result.text).toBe('+12.35%');
    expect(result.class).toBe('positive');
  });

  it('should format negative percentages with class', () => {
    const result = formatPercentageWithClass(-12.345);
    expect(result.text).toBe('-12.35%');
    expect(result.class).toBe('negative');
  });

  it('should format zero with neutral class', () => {
    const result = formatPercentageWithClass(0);
    expect(result.text).toBe('0.00%');
    expect(result.class).toBe('neutral');
  });
});

describe('htmlFormatters', () => {
  describe('formatFeeDifference', () => {
    it('should format positive fee difference', () => {
      const result = htmlFormatters.formatFeeDifference(123.45);
      expect(result).toContain('fees-24h');
      expect(result).toContain('+$123.45');
    });

    it('should format negative fee difference', () => {
      const result = htmlFormatters.formatFeeDifference(-123.45);
      expect(result).toContain('fees-24h-negative');
      expect(result).toContain('-$123.45');
    });

    it('should handle null fee difference', () => {
      const result = htmlFormatters.formatFeeDifference(null);
      expect(result).toContain('#718096');
      expect(result).toContain('-');
    });
  });

  describe('formatTotalValueWithChange', () => {
    it('should format value with positive change', () => {
      const result = htmlFormatters.formatTotalValueWithChange(1000, 5.5);
      expect(result).toContain('<strong>$1,000.00</strong>');
      expect(result).toContain('price-change-positive');
      expect(result).toContain('+5.50%');
    });

    it('should format value with negative change', () => {
      const result = htmlFormatters.formatTotalValueWithChange(1000, -5.5);
      expect(result).toContain('<strong>$1,000.00</strong>');
      expect(result).toContain('price-change-negative');
      expect(result).toContain('-5.50%');
    });

    it('should format value without change when null', () => {
      const result = htmlFormatters.formatTotalValueWithChange(1000, null);
      expect(result).toBe('<strong>$1,000.00</strong>');
    });

    it('should format value without change when very small', () => {
      const result = htmlFormatters.formatTotalValueWithChange(1000, 0.005);
      expect(result).toBe('<strong>$1,000.00</strong>');
    });

    it('should handle undefined value', () => {
      const result = htmlFormatters.formatTotalValueWithChange(undefined, 5);
      expect(result).toContain('<strong>$0.00</strong>');
    });
  });

  describe('formatPriceWithChange', () => {
    it('should format price with positive change', () => {
      const result = htmlFormatters.formatPriceWithChange(3450.23, 2.45);
      expect(result).toContain('$3,450.23');
      expect(result).toContain('price-change-positive');
      expect(result).toContain('+2.45%');
    });

    it('should format price with negative change', () => {
      const result = htmlFormatters.formatPriceWithChange(3450.23, -2.45);
      expect(result).toContain('$3,450.23');
      expect(result).toContain('price-change-negative');
      expect(result).toContain('-2.45%');
    });

    it('should return N/A for undefined price', () => {
      const result = htmlFormatters.formatPriceWithChange(undefined, 5);
      expect(result).toBe('N/A');
    });

    it('should format price without change when null', () => {
      const result = htmlFormatters.formatPriceWithChange(3450.23, null);
      expect(result).toBe('$3,450.23');
    });
  });

  describe('formatStatusBadge', () => {
    it('should format in-range badge', () => {
      const result = htmlFormatters.formatStatusBadge(true);
      expect(result).toContain('status-in-range');
      expect(result).toContain('In Range');
    });

    it('should format out-of-range badge', () => {
      const result = htmlFormatters.formatStatusBadge(false);
      expect(result).toContain('status-out-range');
      expect(result).toContain('Out of Range');
    });
  });
});