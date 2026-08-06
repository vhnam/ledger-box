import { MESSAGES, type MessageLanguage } from '@vhnam/utils';
import type { IntlShape } from 'react-intl';

/**
 * Formats a string that may be either a catalog message id (e.g. Valibot schema
 * messages) or a raw English API / fallback string. Known ids go through
 * `formatMessage`; everything else is returned unchanged until API error codes land.
 */
function formatErrorMessage(intl: IntlShape, idOrText: string, values?: Record<string, string | number>): string {
  const language = intl.locale.split('-')[0] as MessageLanguage;
  const catalog = MESSAGES[language] ?? MESSAGES.en;

  if (
    Object.prototype.hasOwnProperty.call(catalog, idOrText) ||
    Object.prototype.hasOwnProperty.call(MESSAGES.en, idOrText)
  ) {
    return intl.formatMessage({ id: idOrText, defaultMessage: MESSAGES.en[idOrText] ?? idOrText }, values);
  }

  return idOrText;
}

export { formatErrorMessage };
