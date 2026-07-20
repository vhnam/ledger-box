import { useState } from 'react';

import { toast } from '@vhnam/ui/components/sonner';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useDeleteTransaction } from '#/queries/transactions/transaction.mutations';

type UseDeleteTransactionDialogActionsOptions = {
  transaction: TransactionDto;
};

export function useDeleteTransactionDialogActions({ transaction }: UseDeleteTransactionDialogActionsOptions) {
  const { mutate: deleteTransaction, isPending } = useDeleteTransaction();
  const [error, setError] = useState<string | null>(null);

  function handleDeleteTransaction(onSuccess: () => void) {
    setError(null);

    deleteTransaction(
      { walletId: transaction.walletId, transactionId: transaction.id },
      {
        onSuccess: () => {
          toast.success('Transaction deleted');
          onSuccess();
        },
        onError: (deleteError) => {
          const message =
            deleteError instanceof Error ? deleteError.message : 'Failed to delete transaction. Please try again.';
          setError(message);
          toast.error('Failed to delete transaction', { description: message });
        },
      },
    );
  }

  return { handleDeleteTransaction, isPending, error };
}
