import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AddTransactionOutput } from '#/schemas/add-transaction.schema';
import type { EditTransactionOutput } from '#/schemas/edit-transaction.schema';

import { addTransaction, deleteTransaction, updateTransaction } from './transaction.api';

type AddTransactionPayload = AddTransactionOutput & {
  walletId: string;
};

export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddTransactionPayload) => addTransaction(payload.walletId, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', variables.walletId] }),
      ]);
    },
  });
}

type UpdateTransactionPayload = EditTransactionOutput & {
  walletId: string;
  transactionId: string;
};

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTransactionPayload) =>
      updateTransaction(payload.walletId, payload.transactionId, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', variables.walletId] }),
      ]);
    },
  });
}

type DeleteTransactionPayload = {
  walletId: string;
  transactionId: string;
};

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteTransactionPayload) => deleteTransaction(payload.walletId, payload.transactionId),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', variables.walletId] }),
      ]);
    },
  });
}
