import { useQuery } from '@tanstack/react-query';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';
import { fetchWalletSummary } from '#/queries/wallet-summary/wallet-summary.api';

export function useWalletSummaryQuery(
  walletId: string,
  params: Pick<TransactionQueryParams, 'filter' | 'from' | 'to'>,
) {
  return useQuery({
    queryKey: ['wallets', walletId, 'summary', params],
    queryFn: () => fetchWalletSummary(walletId, params),
    enabled: walletId.length > 0,
  });
}
