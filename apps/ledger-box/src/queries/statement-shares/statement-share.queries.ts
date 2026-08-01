import { useQuery } from '@tanstack/react-query';

import { fetchPublicStatement, fetchStatementShares } from '#/queries/statement-shares/statement-share.api';

export function useStatementShares(walletId: string, page = 1) {
  return useQuery({
    queryKey: ['wallets', walletId, 'statement-shares', page],
    queryFn: () => fetchStatementShares(walletId, page),
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
