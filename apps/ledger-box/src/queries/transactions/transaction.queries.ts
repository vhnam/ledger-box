import { useQuery } from '@tanstack/react-query';

import { fetchTransactionAttachments, fetchTransactions } from '#/queries/transactions/transaction.api';
import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';

export function useTransactions(walletId: string, params: TransactionQueryParams) {
  return useQuery({
    queryKey: ['transactions', walletId, params],
    queryFn: () => fetchTransactions(walletId, params),
    enabled: walletId.length > 0,
  });
}

export function useTransactionAttachments(walletId: string, transactionId: string, enabled = true) {
  return useQuery({
    queryKey: ['transaction-attachments', walletId, transactionId],
    queryFn: () => fetchTransactionAttachments(walletId, transactionId),
    enabled: enabled && walletId.length > 0 && transactionId.length > 0,
  });
}
