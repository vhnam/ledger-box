import { reset, useForm } from '@formisch/react';
import { useEffect, useState } from 'react';

import { toast } from '@vhnam/ui/components/sonner';

import { useAddTransaction } from '#/queries/transactions/transaction.mutations';
import type { WalletDto } from '#/queries/wallets/wallet.dto';
import {
  addTransactionSchema,
  type AddTransactionInput,
  type AddTransactionOutput,
} from '#/schemas/add-transaction.schema';

type UseAddTransactionDialogActionsOptions = {
  open: boolean;
  walletId: string;
  wallets: WalletDto[];
};

function getDefaultInput(): AddTransactionInput {
  return {
    type: 'expense',
    amount: '',
    description: '',
  };
}

export function useAddTransactionDialogActions({ open, walletId, wallets }: UseAddTransactionDialogActionsOptions) {
  const form = useForm({ schema: addTransactionSchema });
  const { mutate: addTransaction, isPending } = useAddTransaction();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    reset(form, {
      initialInput: getDefaultInput(),
    });
  }, [open, walletId, form]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      reset(form);
    }
  }

  function handleAddTransaction(output: AddTransactionOutput, onSuccess: () => void) {
    setError(null);

    const wallet = wallets.find((item) => item.id === walletId);

    addTransaction(
      { walletId, ...output },
      {
        onSuccess: () => {
          toast.success('Transaction added', {
            description: wallet?.name ?? 'Wallet',
          });
          onSuccess();
        },
        onError: (addError) => {
          const message = addError instanceof Error ? addError.message : 'Failed to add transaction. Please try again.';
          setError(message);
          toast.error('Failed to add transaction', { description: message });
        },
      },
    );
  }

  return { form, handleOpenChange, handleAddTransaction, isPending, error };
}
