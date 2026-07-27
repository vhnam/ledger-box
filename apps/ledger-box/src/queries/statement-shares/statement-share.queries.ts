import { useQuery } from '@tanstack/react-query';

import { fetchPublicStatement, fetchStatementShares } from '#/queries/statement-shares/statement-share.api';

export function useStatementShares(walletId: string) {
  return useQuery({
    queryKey: ['wallets', walletId, 'statement-shares'],
    queryFn: () => fetchStatementShares(walletId),
    enabled: walletId.length > 0,
  });
}

export function usePublicStatement(token: string) {
  return useQuery({
    queryKey: ['public-statement', token],
    queryFn: () => fetchPublicStatement(token),
    enabled: token.length > 0,
    retry: false,
  });
}
