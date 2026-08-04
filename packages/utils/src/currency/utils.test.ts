import { describe, expect, it } from 'vite-plus/test';

import {
  formatCurrency,
  formatShortCurrency,
  formatSignedCurrency,
  roundCurrencyAmount,
  toCurrencyAmount,
} from './utils.ts';

describe('toCurrencyAmount', () => {
  it('returns the number as-is', () => {
    expect(toCurrencyAmount(1234.5)).toBe(1234.5);
  });

  it('parses a numeric string', () => {
    expect(toCurrencyAmount('1234.5')).toBe(1234.5);
  });

  it('returns 0 for a non-numeric string', () => {
    expect(toCurrencyAmount('not-a-number')).toBe(0);
  });

  it('returns 0 for NaN/Infinity', () => {
    expect(toCurrencyAmount(Number.NaN)).toBe(0);
    expect(toCurrencyAmount(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('roundCurrencyAmount', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundCurrencyAmount(1.005)).toBeCloseTo(1, 2);
    expect(roundCurrencyAmount('10.126')).toBe(10.13);
  });
});

describe('formatShortCurrency', () => {
  it('formats millions with "tr" suffix', () => {
    expect(formatShortCurrency(2_000_000)).toBe('2tr');
  });

  it('formats millions with a fractional remainder', () => {
    expect(formatShortCurrency(2_500_000)).toBe('2,5tr');
  });

  it('formats thousands with "k" suffix', () => {
    expect(formatShortCurrency(5_000)).toBe('5k');
  });

  it('formats thousands with a fractional remainder', () => {
    expect(formatShortCurrency(5_500)).toBe('5,5k');
  });

  it('formats values below 1000 with locale grouping', () => {
    expect(formatShortCurrency(500)).toBe('500');
  });

  it('handles negative values with a leading sign', () => {
    expect(formatShortCurrency(-2_000_000)).toBe('-2tr');
    expect(formatShortCurrency(-5_000)).toBe('-5k');
    expect(formatShortCurrency(-500)).toBe('-500');
  });
});

describe('formatCurrency', () => {
  it('defaults to compact VND notation', () => {
    expect(formatCurrency(2_000_000)).toBe('2tr');
  });

  it('uses standard Intl formatting for non-VND currencies', () => {
    expect(
      formatCurrency(1234.5, { currency: 'USD', locale: 'en-US', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ).toBe('$1,234.50');
  });

  it('uses standard notation for VND when explicitly requested', () => {
    const result = formatCurrency(2_000_000, { notation: 'standard' });

    expect(result).toContain('2.000.000');
  });

  it('accepts a string amount', () => {
    expect(formatCurrency('2000000')).toBe('2tr');
  });
});

describe('formatSignedCurrency', () => {
  it('prefixes income with a plus sign', () => {
    expect(formatSignedCurrency(2_000_000, 'income')).toBe('+2tr');
  });

  it('prefixes expense with a minus sign', () => {
    expect(formatSignedCurrency(2_000_000, 'expense')).toBe('-2tr');
  });
});
