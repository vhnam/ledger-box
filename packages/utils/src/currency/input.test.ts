import { describe, expect, it } from 'vite-plus/test';

import { formatCurrencyInput, getCurrencyInputCaretPosition, parseCurrencyInput } from './input.ts';

describe('parseCurrencyInput', () => {
  it('returns an empty string for empty/whitespace input', () => {
    expect(parseCurrencyInput('')).toBe('');
    expect(parseCurrencyInput('   ')).toBe('');
  });

  it('strips group separators for maximumFractionDigits = 0 (default vi-VN)', () => {
    expect(parseCurrencyInput('1.234.567')).toBe('1234567');
  });

  it('strips a trailing decimal part when maximumFractionDigits = 0', () => {
    expect(parseCurrencyInput('1.234,56')).toBe('1234');
  });

  it('strips non-digit characters when maximumFractionDigits = 0', () => {
    expect(parseCurrencyInput('abc123def')).toBe('123');
  });

  it('normalizes a leading-zero integer part', () => {
    expect(parseCurrencyInput('0123')).toBe('123');
  });

  it('collapses an all-zero integer part to a single 0', () => {
    expect(parseCurrencyInput('000')).toBe('0');
  });

  it('handles group separator "," when locale uses "." for group (en-US-like custom)', () => {
    expect(parseCurrencyInput('1,234', { locale: 'en-US', maximumFractionDigits: 0 })).toBe('1234');
  });

  it('parses with fraction digits allowed and a "." decimal locale', () => {
    expect(parseCurrencyInput('1,234.56', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1234.56');
  });

  it('limits fraction digits to maximumFractionDigits', () => {
    expect(parseCurrencyInput('1234.56789', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1234.56');
  });

  it('preserves a trailing decimal point while typing', () => {
    expect(parseCurrencyInput('1234.', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1234.');
  });

  it('handles a locale whose decimal separator is "," (e.g. vi-VN with fraction digits)', () => {
    expect(parseCurrencyInput('1.234,5', { locale: 'vi-VN', maximumFractionDigits: 2 })).toBe('1234.5');
  });

  it('handles a trailing "," decimal separator for a comma-decimal locale', () => {
    expect(parseCurrencyInput('1234,', { locale: 'vi-VN', maximumFractionDigits: 2 })).toBe('1234.');
  });

  it('collapses multiple decimal points to the first one', () => {
    expect(parseCurrencyInput('12.34.56', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('12.34');
  });

  it('strips non-numeric characters while allowing decimals', () => {
    expect(parseCurrencyInput('a1b2.c3', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('12.3');
  });

  it('returns an empty integer part when the value starts with a decimal point', () => {
    expect(parseCurrencyInput('.5', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('.5');
  });

  it('returns an empty string when there are no digits at all (fraction digits allowed)', () => {
    expect(parseCurrencyInput('abc', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('');
  });

  it('returns an empty string when there are no digits at all (0 fraction digits)', () => {
    expect(parseCurrencyInput('abc')).toBe('');
  });

  it('normalizes a plain integer with fraction digits allowed but none typed', () => {
    expect(parseCurrencyInput('1234', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1234');
  });

  it('handles fr-FR (space-group, comma-decimal) parsing', () => {
    expect(parseCurrencyInput('1 234,56', { locale: 'fr-FR', maximumFractionDigits: 2 })).toBe('1234.56');
  });
});

describe('formatCurrencyInput', () => {
  it('returns an empty string for empty input', () => {
    expect(formatCurrencyInput('')).toBe('');
  });

  it('returns an empty string when the integer part is empty', () => {
    expect(formatCurrencyInput('.56', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('');
  });

  it('returns an empty string when the integer part is not a number', () => {
    expect(formatCurrencyInput('-')).toBe('');
  });

  it('formats an integer with locale grouping (default vi-VN, 0 fraction digits)', () => {
    expect(formatCurrencyInput('1234567')).toBe('1.234.567');
  });

  it('formats with a fraction part', () => {
    expect(formatCurrencyInput('1234.5', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1,234.5');
  });

  it('limits the formatted fraction part to maximumFractionDigits', () => {
    expect(formatCurrencyInput('1234.56789', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1,234.56');
  });

  it('preserves a trailing decimal point while typing', () => {
    expect(formatCurrencyInput('1234.', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1,234.');
  });

  it('uses the locale decimal separator when formatting', () => {
    expect(formatCurrencyInput('1234.5', { locale: 'vi-VN', maximumFractionDigits: 2 })).toBe('1.234,5');
  });

  it('formats a plain integer with fraction digits allowed but none typed', () => {
    expect(formatCurrencyInput('1234', { locale: 'en-US', maximumFractionDigits: 2 })).toBe('1,234');
  });

  it('formats using fr-FR separators (space group, comma decimal)', () => {
    expect(formatCurrencyInput('1234.56', { locale: 'fr-FR', maximumFractionDigits: 2 })).toBe('1 234,56');
  });
});

describe('getCurrencyInputCaretPosition', () => {
  it('returns 0 when the caret is before any digit', () => {
    expect(getCurrencyInputCaretPosition('abc123', 'abc123', 0)).toBe(0);
  });

  it('keeps the caret after the same number of digits once formatting changes', () => {
    expect(getCurrencyInputCaretPosition('1234', '1.234', 4)).toBe(5);
  });

  it('places the caret at the end when digit count exceeds the new value length', () => {
    expect(getCurrencyInputCaretPosition('999', '1', 3)).toBe(1);
  });

  it('handles caret position in the middle of a formatted value', () => {
    expect(getCurrencyInputCaretPosition('1234567', '1.234.567', 3)).toBe(4);
  });
});
