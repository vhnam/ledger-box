export type CurrencyInput = number | string;

export type CurrencySignType = 'income' | 'expense';

export type CurrencyNotation = 'standard' | 'compact';

export type FormatCurrencyOptions = {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: CurrencyNotation;
};
