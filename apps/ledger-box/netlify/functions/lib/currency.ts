import { CURRENCY_FRACTION_DIGITS } from '@vhnam/utils/currency';

const ALLOWED_WALLET_CURRENCIES = Object.keys(CURRENCY_FRACTION_DIGITS);

function isAllowedCurrency(value: unknown): value is string {
  return typeof value === 'string' && ALLOWED_WALLET_CURRENCIES.includes(value);
}

export { ALLOWED_WALLET_CURRENCIES, isAllowedCurrency };
