import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import { formatErrorMessage } from '#/lib/intl-message';

import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { useDeleteWallet } from '#/queries/wallets/wallet.mutations';

type DeleteWalletDialogProps = {
  wallet: WalletDto;
};

export function useDeleteWalletDialogActions({ wallet }: DeleteWalletDialogProps) {
  const intl = useIntl();
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

        toast.add({
          title: intl.formatMessage({ id: 'toast.wallet.deleted', defaultMessage: 'Wallet deleted' }),
          type: 'success',
        });
        onSuccess();

        if (remaining.length > 0) {
          await navigate({ to: '/wallets/$walletId', params: { walletId: remaining[0].id } });
          return;
        }

        await navigate({ to: '/wallets' });
      },
      onError: (deleteError) => {
        const message = deleteError instanceof Error ? deleteError.message : 'wallet.delete.errorFallback';
        setError(message);
        toast.add({
          title: intl.formatMessage({ id: 'toast.wallet.deleteFailed', defaultMessage: 'Failed to delete wallet' }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  return { handleDeleteWallet, isPending, error };
}
