import { useQuery } from '@tanstack/react-query';

import { fetchTransactions } from './transaction.api';
import type { TransactionQueryParams } from './transaction.params';

export function useTransactions(walletId: string, params: TransactionQueryParams) {
  return useQuery({
    queryKey: ['transactions', walletId, params],
    queryFn: () => fetchTransactions(walletId, params),
    enabled: walletId.length > 0,
  });
}
