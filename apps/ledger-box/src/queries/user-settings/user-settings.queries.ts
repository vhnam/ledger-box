import { useQuery } from '@tanstack/react-query';

import { fetchUserLocale } from '#/queries/user-settings/user-settings.api';

export const userLocaleQueryKey = ['user-settings', 'locale'] as const;

export function useUserLocale() {
  return useQuery({
    queryKey: userLocaleQueryKey,
    queryFn: fetchUserLocale,
    // Unauthenticated routes (login, register, the public statement page) 401 here by
    // design — no need to retry; callers fall back to DEFAULT_LOCALE.
    retry: false,
  });
}
