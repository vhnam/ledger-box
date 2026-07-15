import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_LOCALE,
  DEFAULT_MAXIMUM_FRACTION_DIGITS,
  DEFAULT_MINIMUM_FRACTION_DIGITS,
} from './constants.ts';
import type { CurrencyInput, CurrencySignType, FormatCurrencyOptions } from './types.ts';

function resolveFormatCurrencyOptions(options: FormatCurrencyOptions = {}) {
  return {
    locale: options.locale ?? DEFAULT_CURRENCY_LOCALE,
    currency: options.currency ?? DEFAULT_CURRENCY_CODE,
    minimumFractionDigits: options.minimumFractionDigits ?? DEFAULT_MINIMUM_FRACTION_DIGITS,
    maximumFractionDigits: options.maximumFractionDigits ?? DEFAULT_MAXIMUM_FRACTION_DIGITS,
  };
}

export function toCurrencyAmount(amount: CurrencyInput): number {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

  return Number.isFinite(value) ? value : 0;
}

export function roundCurrencyAmount(amount: CurrencyInput): number {
  return Math.round(toCurrencyAmount(amount) * 100) / 100;
}

function formatCompactVndAmount(amount: number, locale: string): string {
  const value = Math.round(amount);
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000) {
    const scaled = absValue / 1_000_000;

    return (
      sign + (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toLocaleString(locale, { maximumFractionDigits: 1 })) + 'tr'
    );
  }

  if (absValue >= 1_000) {
    const scaled = absValue / 1_000;

    return (
      sign + (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toLocaleString(locale, { maximumFractionDigits: 1 })) + 'k'
    );
  }

  return value.toLocaleString(locale);
}

export function formatShortCurrency(amount: CurrencyInput, options: FormatCurrencyOptions = {}): string {
  const resolvedOptions = resolveFormatCurrencyOptions(options);

  return formatCompactVndAmount(toCurrencyAmount(amount), resolvedOptions.locale);
}

export function formatCurrency(amount: CurrencyInput, options: FormatCurrencyOptions = {}): string {
  const resolvedOptions = resolveFormatCurrencyOptions(options);
  const notation = options.notation ?? (resolvedOptions.currency === 'VND' ? 'compact' : 'standard');

  if (notation === 'compact' && resolvedOptions.currency === 'VND') {
    return formatShortCurrency(amount, resolvedOptions);
  }

  return new Intl.NumberFormat(resolvedOptions.locale, {
    style: 'currency',
    currency: resolvedOptions.currency,
    minimumFractionDigits: resolvedOptions.minimumFractionDigits,
    maximumFractionDigits: resolvedOptions.maximumFractionDigits,
  }).format(toCurrencyAmount(amount));
}

export function formatSignedCurrency(
  amount: CurrencyInput,
  type: CurrencySignType,
  options: FormatCurrencyOptions = {},
): string {
  const sign = type === 'income' ? '+' : '-';

  return `${sign}${formatCurrency(toCurrencyAmount(amount), options)}`;
}
