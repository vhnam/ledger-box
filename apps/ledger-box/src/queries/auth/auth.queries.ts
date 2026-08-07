import { useQuery } from '@tanstack/react-query';

import { authClient } from '#/lib/auth-client';

import type { LinkedAccountDto } from '#/queries/auth/auth.dto';

export const linkedAccountsQueryKey = ['auth', 'linked-accounts'] as const;

async function fetchLinkedAccounts(): Promise<LinkedAccountDto[]> {
  const { data, error } = await authClient.listAccounts();

  if (error) {
    throw new Error(error.message ?? 'settings.account.signInMethods.loadErrorFallback');
  }

  return data ?? [];
}

export function useLinkedAccounts() {
  return useQuery({
    queryKey: linkedAccountsQueryKey,
    queryFn: fetchLinkedAccounts,
  });
}
