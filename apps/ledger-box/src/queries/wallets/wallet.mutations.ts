import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TransferMoneyOutput } from '#/schemas/transfer-money.schema';

import { createWallet, transferMoney } from './wallet.api';

export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWallet,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}

export function useTransferMoney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransferMoneyOutput) => transferMoney(payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', variables.fromWalletId] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', variables.toWalletId] }),
      ]);
    },
  });
}
