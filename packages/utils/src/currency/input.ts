import { DEFAULT_CURRENCY_LOCALE, DEFAULT_MAXIMUM_FRACTION_DIGITS } from './constants.ts';
import type { FormatCurrencyOptions } from './types.ts';

type CurrencyInputFormatOptions = Pick<FormatCurrencyOptions, 'locale' | 'maximumFractionDigits'>;

function resolveCurrencyInputOptions(options: CurrencyInputFormatOptions = {}) {
  return {
    locale: options.locale ?? DEFAULT_CURRENCY_LOCALE,
    maximumFractionDigits: options.maximumFractionDigits ?? DEFAULT_MAXIMUM_FRACTION_DIGITS,
  };
}

function getLocaleNumberSeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);

  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  };
}

function normalizeIntegerPart(integerPart: string): string {
  if (!integerPart) {
    return '';
  }

  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    return integerPart.replace(/^0+/, '') || '0';
  }

  return integerPart;
}

function normalizeRawCurrencyValue(value: string, maximumFractionDigits: number): string {
  if (!value) {
    return '';
  }

  const [integerPart = '', fractionPart] = value.split('.');

  if (maximumFractionDigits === 0) {
    return normalizeIntegerPart(integerPart);
  }

  const hasTrailingDecimal = value.endsWith('.');
  const normalizedInteger = normalizeIntegerPart(integerPart);

  if (fractionPart !== undefined || hasTrailingDecimal) {
    const limitedFraction = fractionPart?.slice(0, maximumFractionDigits) ?? '';

    return hasTrailingDecimal && !fractionPart ? `${normalizedInteger}.` : `${normalizedInteger}.${limitedFraction}`;
  }

  return normalizedInteger;
}

export function parseCurrencyInput(displayValue: string, options: CurrencyInputFormatOptions = {}): string {
  const { locale, maximumFractionDigits } = resolveCurrencyInputOptions(options);
  const trimmedValue = displayValue.trim();

  if (!trimmedValue) {
    return '';
  }

  const { group, decimal } = getLocaleNumberSeparators(locale);
  let normalizedValue = trimmedValue;

  if (maximumFractionDigits === 0) {
    const decimalIndex = normalizedValue.lastIndexOf(decimal);

    if (decimalIndex !== -1) {
      normalizedValue = normalizedValue.slice(0, decimalIndex);
    }

    if (group === '.') {
      normalizedValue = normalizedValue.replaceAll('.', '');
    } else if (group) {
      normalizedValue = normalizedValue.split(group).join('');
    }

    normalizedValue = normalizedValue.replace(/\D/g, '');

    return normalizeRawCurrencyValue(normalizedValue, maximumFractionDigits);
  }

  if (group) {
    normalizedValue = normalizedValue.split(group).join('');
  }

  if (decimal !== '.') {
    const decimalIndex = normalizedValue.lastIndexOf(decimal);

    if (decimalIndex !== -1) {
      normalizedValue =
        normalizedValue.slice(0, decimalIndex).replaceAll(decimal, '') + '.' + normalizedValue.slice(decimalIndex + 1);
    }
  }

  normalizedValue = normalizedValue.replace(/[^\d.]/g, '');

  const firstDecimalIndex = normalizedValue.indexOf('.');

  if (firstDecimalIndex !== -1) {
    normalizedValue =
      normalizedValue.slice(0, firstDecimalIndex + 1) + normalizedValue.slice(firstDecimalIndex + 1).replace(/\./g, '');
  }

  return normalizeRawCurrencyValue(normalizedValue, maximumFractionDigits);
}

export function formatCurrencyInput(rawValue: string, options: CurrencyInputFormatOptions = {}): string {
  const { locale, maximumFractionDigits } = resolveCurrencyInputOptions(options);

  if (!rawValue) {
    return '';
  }

  const [integerPart = ''] = rawValue.split('.');

  if (!integerPart) {
    return '';
  }

  const parsedInteger = Number.parseInt(integerPart, 10);

  if (Number.isNaN(parsedInteger)) {
    return '';
  }

  const formattedInteger = parsedInteger.toLocaleString(locale, { maximumFractionDigits: 0 });

  if (maximumFractionDigits === 0) {
    return formattedInteger;
  }

  const { decimal } = getLocaleNumberSeparators(locale);
  const hasTrailingDecimal = rawValue.endsWith('.');
  const fractionPart = rawValue.split('.')[1];

  if (fractionPart !== undefined) {
    return `${formattedInteger}${decimal}${fractionPart.slice(0, maximumFractionDigits)}`;
  }

  if (hasTrailingDecimal) {
    return `${formattedInteger}${decimal}`;
  }

  return formattedInteger;
}

export function getCurrencyInputCaretPosition(
  previousDisplayValue: string,
  nextDisplayValue: string,
  caretPosition: number,
): number {
  const digitsBeforeCaret = previousDisplayValue.slice(0, caretPosition).replace(/\D/g, '').length;

  if (digitsBeforeCaret <= 0) {
    return 0;
  }

  let digitsSeen = 0;

  for (let index = 0; index < nextDisplayValue.length; index += 1) {
    if (/\d/.test(nextDisplayValue[index] ?? '')) {
      digitsSeen += 1;
    }

    if (digitsSeen >= digitsBeforeCaret) {
      return index + 1;
    }
  }

  return nextDisplayValue.length;
}

export const DEFAULT_CURRENCY_INPUT_OPTIONS: CurrencyInputFormatOptions = {
  locale: DEFAULT_CURRENCY_LOCALE,
  maximumFractionDigits: DEFAULT_MAXIMUM_FRACTION_DIGITS,
};
