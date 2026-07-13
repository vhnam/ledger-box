import { useQuery } from '@tanstack/react-query';

import { fetchTransactions } from './transaction.api';

type UseTransactionsParams = {
  page: number;
  pageSize: number;
};

export function useTransactions(walletId: string, { page, pageSize }: UseTransactionsParams) {
  return useQuery({
    queryKey: ['transactions', walletId, { page, pageSize }],
    queryFn: () => fetchTransactions(walletId, { page, pageSize }),
    enabled: walletId.length > 0,
  });
}
