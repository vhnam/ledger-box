import { MESSAGES, toMessageLanguage } from '@vhnam/utils';
import type { IntlShape } from 'react-intl';

/**
 * Formats a string that may be either a catalog message id (e.g. Valibot schema
 * messages) or a raw English API / fallback string. Known ids go through
 * `formatMessage`; everything else is returned unchanged.
 */
function formatErrorMessage(intl: IntlShape, idOrText: string, values?: Record<string, string | number>): string {
  const catalog = MESSAGES[toMessageLanguage(intl.locale)];
  const fallbackCatalog = MESSAGES['en-US'];

  if (
    Object.prototype.hasOwnProperty.call(catalog, idOrText) ||
    Object.prototype.hasOwnProperty.call(fallbackCatalog, idOrText)
  ) {
    return intl.formatMessage({ id: idOrText, defaultMessage: fallbackCatalog[idOrText] ?? idOrText }, values);
  }

  return idOrText;
}

export { formatErrorMessage };
