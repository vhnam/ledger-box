import { useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import { formatErrorMessage } from '#/lib/intl-message';
import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useDeleteTransaction } from '#/queries/transactions/transaction.mutations';

type UseDeleteTransactionDialogActionsOptions = {
  transaction: TransactionDto;
};

export function useDeleteTransactionDialogActions({ transaction }: UseDeleteTransactionDialogActionsOptions) {
  const intl = useIntl();
  const { mutate: deleteTransaction, isPending } = useDeleteTransaction();
  const [error, setError] = useState<string | null>(null);

  function handleDeleteTransaction(onSuccess: () => void) {
    setError(null);

    deleteTransaction(
      { walletId: transaction.walletId, transactionId: transaction.id },
      {
        onSuccess: () => {
          toast.add({
            title: intl.formatMessage({ id: 'toast.transaction.deleted', defaultMessage: 'Transaction deleted' }),
            type: 'success',
          });
          onSuccess();
        },
        onError: (deleteError) => {
          const message = deleteError instanceof Error ? deleteError.message : 'transaction.delete.errorFallback';
          setError(message);
          toast.add({
            title: intl.formatMessage({
              id: 'toast.transaction.deleteFailed',
              defaultMessage: 'Failed to delete transaction',
            }),
            description: formatErrorMessage(intl, message),
            type: 'error',
          });
        },
      },
    );
  }

  return { handleDeleteTransaction, isPending, error };
}
