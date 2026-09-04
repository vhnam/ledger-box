import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { fetchTransactionAttachments, fetchTransactions } from '#/queries/transactions/transaction.api';
import type { TransactionsPageDto } from '#/queries/transactions/transaction.dto';
import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';

export function useTransactions(walletId: string, params: TransactionQueryParams) {
  return useQuery({
    queryKey: ['transactions', walletId, params],
    queryFn: () => fetchTransactions(walletId, params),
    enabled: walletId.length > 0,
  });
}

function findCachedTransaction(queryClient: QueryClient, walletId: string, transactionId: string) {
  const queries = queryClient.getQueriesData<TransactionsPageDto>({ queryKey: ['transactions', walletId] });

  for (const [, data] of queries) {
    const match = data?.items.find((item) => item.id === transactionId);

    if (match) {
      return match;
    }
  }

  return undefined;
}

export function useTransaction(walletId: string, transactionId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['transaction', walletId, transactionId],
    queryFn: async () => {
      const cached = findCachedTransaction(queryClient, walletId, transactionId);

      if (cached) {
        return cached;
      }

      // No get-by-id endpoint exists; scan a large page as a fallback for deep links/refreshes.
      const page = await fetchTransactions(walletId, { page: 1, pageSize: 500 });

      return page.items.find((item) => item.id === transactionId) ?? null;
    },
    enabled: walletId.length > 0 && transactionId.length > 0,
  });
}

export function useTransactionAttachments(walletId: string, transactionId: string, enabled = true) {
  return useQuery({
    queryKey: ['transaction-attachments', walletId, transactionId],
    queryFn: () => fetchTransactionAttachments(walletId, transactionId),
    enabled: enabled && walletId.length > 0 && transactionId.length > 0,
  });
}
