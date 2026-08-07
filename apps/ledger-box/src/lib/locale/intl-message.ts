import type { IntlShape } from 'react-intl';

import { DEFAULT_MESSAGES } from '@vhnam/utils/i18n';

/**
 * Formats a string that may be either a catalog message id (e.g. Valibot schema
 * messages) or a raw English API / fallback string. Known ids go through
 * `formatMessage`; everything else is returned unchanged.
 */
function formatErrorMessage(intl: IntlShape, idOrText: string, values?: Record<string, string | number>): string {
  if (
    Object.prototype.hasOwnProperty.call(intl.messages, idOrText) ||
    Object.prototype.hasOwnProperty.call(DEFAULT_MESSAGES, idOrText)
  ) {
    return intl.formatMessage({ id: idOrText, defaultMessage: DEFAULT_MESSAGES[idOrText] ?? idOrText }, values);
  }

  return idOrText;
}

export { formatErrorMessage };
