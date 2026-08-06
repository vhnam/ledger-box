import { DEFAULT_LOCALE, MESSAGES, toMessageLanguage, type SupportedLocale } from '@vhnam/utils';
import { useMemo, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import { useSession } from '#/lib/auth-client';
import { resolveClientLocale } from '#/lib/client-locale';
import { useUserLocale } from '#/queries/user-settings/user-settings.queries';

type LocaleProviderProps = {
  children: ReactNode;
};

/**
 * Resolves the active locale: signed-in users use their stored preference; unauthenticated
 * viewers (auth, invite, public statement) use the browser Accept-Language via
 * `resolveClientLocale`. While the signed-in locale query is still loading, keep the
 * previous signed-in fallback of `DEFAULT_LOCALE` to avoid a flash of browser locale on
 * first paint after login.
 */
function useResolvedLocale(): SupportedLocale {
  const { data: session, isPending: isSessionPending } = useSession();
  const isSignedIn = Boolean(session?.user);
  const { data, isPending: isLocalePending, isError } = useUserLocale({ enabled: isSignedIn });

  const browserLocale = useMemo(() => resolveClientLocale() as SupportedLocale, []);

  if (isSignedIn) {
    if (data?.locale) {
      return data.locale;
    }

    // Signed in but locale still loading (or failed) — prefer default over browser so the
    // shell does not briefly flip languages before the stored preference arrives.
    if (isLocalePending || isSessionPending) {
      return DEFAULT_LOCALE;
    }

    if (isError) {
      return browserLocale;
    }

    return DEFAULT_LOCALE;
  }

  return browserLocale;
}

/**
 * Provides translated strings (via `react-intl`) from the signed-in user's stored locale,
 * or from the viewer's browser locale on unauthenticated routes.
 */
function LocaleProvider({ children }: LocaleProviderProps) {
  const locale = useResolvedLocale();

  return (
    <IntlProvider locale={locale} messages={MESSAGES[toMessageLanguage(locale)]}>
      {children}
    </IntlProvider>
  );
}

/**
 * Resolves the viewer's locale for `formatCurrency`/date formatting — independent of
 * `react-intl`'s own context, since those functions never route through `react-intl`
 * (see AGENTS.md's formatting-ownership rule). Matches `LocaleProvider` resolution so
 * messages and number/date formatting stay aligned.
 */
function useAppLocale(): SupportedLocale {
  return useResolvedLocale();
}

export { LocaleProvider, useAppLocale };
