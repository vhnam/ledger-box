import { useQuery } from '@tanstack/react-query';

import { fetchUserLocale } from '#/queries/user-settings/user-settings.api';

export const userLocaleQueryKey = ['user-settings', 'locale'] as const;

type UseUserLocaleOptions = {
  enabled?: boolean;
};

export function useUserLocale(options: UseUserLocaleOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: userLocaleQueryKey,
    queryFn: fetchUserLocale,
    enabled,
    // Unauthenticated routes skip this query via `enabled: false`. When enabled and a
    // 401 still occurs, do not retry — callers fall back to browser/default locale.
    retry: false,
  });
}
