import { reset, useForm } from '@formisch/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/ui/toast';

import { updateWalletSchema, type UpdateWalletSchema } from '#/schemas/wallet.schema';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { useDeleteWallet, useUpdateWallet } from '#/queries/wallets/wallet.mutations';

type UseWalletSettingsGeneralActionsOptions = {
  wallet: WalletDto;
};

type DeleteWalletDialogProps = {
  wallet: WalletDto;
};

export function useWalletSettingsGeneralActions({ wallet }: UseWalletSettingsGeneralActionsOptions) {
  const intl = useIntl();
  const form = useForm({
    schema: updateWalletSchema,
    initialInput: { name: wallet.name },
  });
  const { mutate: updateWallet, isPending: isUpdating } = useUpdateWallet(wallet.id);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    setUpdateError(null);
    reset(form, {
      initialInput: { name: wallet.name },
    });
  }, [wallet, form]);

  function handleUpdateWallet(output: UpdateWalletSchema) {
    setUpdateError(null);

    updateWallet(output, {
      onSuccess: () => {
        toast.add({
          title: intl.formatMessage({ id: 'toast.wallet.updated', defaultMessage: 'Wallet updated' }),
          type: 'success',
        });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'wallet.settings.general.updateErrorFallback';
        setUpdateError(message);
        toast.add({
          title: intl.formatMessage({ id: 'toast.wallet.updateFailed', defaultMessage: 'Failed to update wallet' }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  return { form, updateError, isUpdating, handleUpdateWallet };
}

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
