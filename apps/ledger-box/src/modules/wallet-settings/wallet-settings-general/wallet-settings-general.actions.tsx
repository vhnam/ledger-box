import { reset, useForm } from '@formisch/react';
import { useEffect, useState } from 'react';

import { toast } from '@vhnam/ui/components/toast';

import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { useUpdateWallet } from '#/queries/wallets/wallet.mutations';
import { updateWalletSchema, type UpdateWalletSchema } from '#/schemas/wallet.schema';

type UseWalletSettingsGeneralActionsOptions = {
  wallet: WalletDto;
};

export function useWalletSettingsGeneralActions({ wallet }: UseWalletSettingsGeneralActionsOptions) {
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
        toast.add({ title: 'Wallet updated', type: 'success' });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to update wallet. Please try again.';
        setUpdateError(message);
        toast.add({ title: 'Failed to update wallet', description: message, type: 'error' });
      },
    });
  }

  return { form, updateError, isUpdating, handleUpdateWallet };
}
