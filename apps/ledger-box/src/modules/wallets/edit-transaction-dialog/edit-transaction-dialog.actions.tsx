import { reset, useForm } from '@formisch/react';
import { useEffect, useState } from 'react';

import { toast } from '@vhnam/ui/components/toast';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useUpdateTransaction } from '#/queries/transactions/transaction.mutations';
import {
  editTransactionSchema,
  type EditTransactionInput,
  type EditTransactionOutput,
} from '#/schemas/edit-transaction.schema';

type UseEditTransactionDialogActionsOptions = {
  open: boolean;
  transaction: TransactionDto;
};

function formatAmountForInput(amount: number): string {
  return String(Math.round(amount));
}

function getInitialInput(transaction: TransactionDto): EditTransactionInput {
  return {
    type: transaction.type,
    amount: formatAmountForInput(transaction.amount),
    description: transaction.description,
  };
}

export function useEditTransactionDialogActions({ open, transaction }: UseEditTransactionDialogActionsOptions) {
  const form = useForm({ schema: editTransactionSchema });
  const { mutate: updateTransaction, isPending } = useUpdateTransaction();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    reset(form, {
      initialInput: getInitialInput(transaction),
    });
  }, [open, transaction, form]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      reset(form);
    }
  }

  function handleEditTransaction(output: EditTransactionOutput, onSuccess: () => void) {
    setError(null);

    updateTransaction(
      { walletId: transaction.walletId, transactionId: transaction.id, ...output },
      {
        onSuccess: () => {
          toast.add({ title: 'Transaction updated', type: 'success' });
          onSuccess();
        },
        onError: (updateError) => {
          const message =
            updateError instanceof Error ? updateError.message : 'Failed to update transaction. Please try again.';
          setError(message);
          toast.add({ title: 'Failed to update transaction', description: message, type: 'error' });
        },
      },
    );
  }

  return { form, handleOpenChange, handleEditTransaction, isPending, error };
}
