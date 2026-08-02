import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { toast } from '@vhnam/ui/components/toast';

import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { useDeleteWallet } from '#/queries/wallets/wallet.mutations';

type DeleteWalletDialogProps = {
  wallet: WalletDto;
};

export function useDeleteWalletDialogActions({ wallet }: DeleteWalletDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: deleteWallet, isPending } = useDeleteWallet();
  const [error, setError] = useState<string | null>(null);

  function handleDeleteWallet(onSuccess: () => void) {
    setError(null);

    deleteWallet(wallet.id, {
      onSuccess: async () => {
        const wallets = queryClient.getQueryData<WalletDto[]>(['wallets']) ?? [];
        const remaining = wallets.filter((item) => item.id !== wallet.id);

        toast.add({ title: 'Wallet deleted', type: 'success' });
        onSuccess();

        if (remaining.length > 0) {
          await navigate({ to: '/wallets/$walletId', params: { walletId: remaining[0].id } });
          return;
        }

        await navigate({ to: '/wallets' });
      },
      onError: (deleteError) => {
        const message =
          deleteError instanceof Error ? deleteError.message : 'Failed to delete wallet. Please try again.';
        setError(message);
        toast.add({ title: 'Failed to delete wallet', description: message, type: 'error' });
      },
    });
  }

  return { handleDeleteWallet, isPending, error };
}
