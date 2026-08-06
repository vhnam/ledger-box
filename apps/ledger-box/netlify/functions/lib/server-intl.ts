import { DEFAULT_LOCALE, MESSAGES, toMessageLanguage, type SupportedLocale } from '@vhnam/utils';
import { createIntl, createIntlCache, type IntlShape } from 'react-intl';

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
