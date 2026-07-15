import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AddTransactionOutput } from '#/schemas/add-transaction.schema';

import { addTransaction } from './transaction.api';

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
