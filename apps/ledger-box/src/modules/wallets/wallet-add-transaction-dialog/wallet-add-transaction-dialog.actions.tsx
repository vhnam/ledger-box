import { reset, useForm } from '@formisch/react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import {
  addTransactionSchema,
  type AddTransactionInput,
  type AddTransactionOutput,
} from '#/schemas/add-transaction.schema';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import { useAddTransaction } from '#/queries/transactions/transaction.mutations';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

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
    occurredAt: undefined,
  };
}

export function useAddTransactionDialogActions({ open, walletId, wallets }: UseAddTransactionDialogActionsOptions) {
  const intl = useIntl();
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
          toast.add({
            title: intl.formatMessage({ id: 'toast.transaction.added', defaultMessage: 'Transaction added' }),
            description: wallet?.name ?? intl.formatMessage({ id: 'common.walletFallback', defaultMessage: 'Wallet' }),
            type: 'success',
          });
          onSuccess();
        },
        onError: (addError) => {
          const message = addError instanceof Error ? addError.message : 'transaction.add.errorFallback';
          setError(message);
          toast.add({
            title: intl.formatMessage({
              id: 'toast.transaction.addFailed',
              defaultMessage: 'Failed to add transaction',
            }),
            description: formatErrorMessage(intl, message),
            type: 'error',
          });
        },
      },
    );
  }

  return { form, handleOpenChange, handleAddTransaction, isPending, error };
}
