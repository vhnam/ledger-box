import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TransferMoneyOutput } from '#/schemas/transfer-money.schema';
import type { UpdateWalletSchema } from '#/schemas/wallet.schema';

import { createWallet, deleteWallet, transferMoney, updateWallet } from '#/queries/wallets/wallet.api';

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
        queryClient.invalidateQueries({ queryKey: ['activity', variables.fromWalletId] }),
        queryClient.invalidateQueries({ queryKey: ['activity', variables.toWalletId] }),
      ]);
    },
  });
}

export function useUpdateWallet(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateWalletSchema) => updateWallet(walletId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet', walletId] }),
        queryClient.invalidateQueries({ queryKey: ['activity', walletId] }),
      ]);
    },
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWallet,
    onSuccess: async (_data, walletId) => {
      queryClient.removeQueries({ queryKey: ['wallet', walletId] });
      queryClient.removeQueries({ queryKey: ['transactions', walletId] });
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}
