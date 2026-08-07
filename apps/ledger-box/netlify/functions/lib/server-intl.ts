import { createIntl, createIntlCache, type IntlShape } from 'react-intl';

import { MESSAGES, toMessageLanguage } from '@vhnam/utils/i18n/all-messages';
import { DEFAULT_LOCALE, type SupportedLocale } from '@vhnam/utils/locale';

const intlCache = createIntlCache();

/** Server-side `react-intl` instance for Netlify handlers (invite emails, etc.). */
function createServerIntl(locale: SupportedLocale = DEFAULT_LOCALE): IntlShape {
  return createIntl(
    {
      locale,
      defaultLocale: DEFAULT_LOCALE,
      messages: MESSAGES[toMessageLanguage(locale)],
    },
    intlCache,
  );
}

export { createServerIntl };
