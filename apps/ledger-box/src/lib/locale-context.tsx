import { DEFAULT_LOCALE, MESSAGES, type MessageLanguage, type SupportedLocale } from '@vhnam/utils';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import { useUserLocale } from '#/queries/user-settings/user-settings.queries';

/** `en-US`/`en-GB` share the `en` message catalog — see the language vs. locale key split in AGENTS.md. */
function toMessageLanguage(locale: SupportedLocale): MessageLanguage {
  return locale.split('-')[0] as MessageLanguage;
}

type LocaleProviderProps = {
  children: ReactNode;
};

/**
 * Provides translated strings (via `react-intl`) sourced from the signed-in user's stored
 * locale. Before the locale query resolves, falls back to `en-US`/`en` messages, matching
 * the loading-state convention used elsewhere in the app shell.
 */
function LocaleProvider({ children }: LocaleProviderProps) {
  const { data } = useUserLocale();
  const locale = data?.locale ?? DEFAULT_LOCALE;

  return (
    <IntlProvider locale={locale} messages={MESSAGES[toMessageLanguage(locale)]}>
      {children}
    </IntlProvider>
  );
}

/**
 * Resolves the signed-in viewer's stored locale for use with `formatCurrency`/date
 * formatting — independent of `react-intl`'s own context, since those functions never
 * route through `react-intl` (see AGENTS.md's formatting-ownership rule). Safe to call
 * from any component under `QueryClientProvider`; the underlying query is cached and
 * shared, not re-fetched per call site.
 */
function useAppLocale(): SupportedLocale {
  const { data } = useUserLocale();

  return data?.locale ?? DEFAULT_LOCALE;
}

export { LocaleProvider, useAppLocale };
