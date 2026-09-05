import { reset, useForm } from '@formisch/react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/ui/toast';

import { LOCALE_TIMEZONE } from '@vhnam/utils/date';

import {
  editTransactionSchema,
  type EditTransactionInput,
  type EditTransactionOutput,
} from '#/schemas/edit-transaction.schema';

import { toZonedDateAndTimeStrings } from '#/utils/wallet/period-bounds';

import { formatErrorMessage } from '#/lib/locale/intl-message';
import { useAppLocale } from '#/lib/locale/locale-context';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useUpdateTransaction } from '#/queries/transactions/transaction.mutations';

type UseEditTransactionDialogActionsOptions = {
  open: boolean;
  transaction: TransactionDto;
};

function formatAmountForInput(amount: number): string {
  return String(Math.round(amount));
}

function getInitialInput(transaction: TransactionDto, timezone: string): EditTransactionInput {
  const { date, time } = toZonedDateAndTimeStrings(new Date(transaction.occurredAt), timezone);

  return {
    type: transaction.type,
    amount: formatAmountForInput(transaction.amount),
    description: transaction.description,
    occurredAt: date,
    occurredTime: time,
  };
}

export function useEditTransactionDialogActions({ open, transaction }: UseEditTransactionDialogActionsOptions) {
  const intl = useIntl();
  const locale = useAppLocale();
  const timezone = LOCALE_TIMEZONE[locale];
  const form = useForm({ schema: editTransactionSchema });
  const { mutate: updateTransaction, isPending } = useUpdateTransaction();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    reset(form, {
      initialInput: getInitialInput(transaction, timezone),
    });
  }, [open, transaction, timezone, form]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      reset(form);
    }
  }

  function handleEditTransaction(output: EditTransactionOutput, onSuccess: () => void) {
    setError(null);

    updateTransaction(
      { walletId: transaction.walletId, transactionId: transaction.id, timezone, ...output },
      {
        onSuccess: () => {
          toast.add({
            title: intl.formatMessage({ id: 'toast.transaction.updated', defaultMessage: 'Transaction updated' }),
            type: 'success',
          });
          onSuccess();
        },
        onError: (updateError) => {
          const message = updateError instanceof Error ? updateError.message : 'transaction.edit.errorFallback';
          setError(message);
          toast.add({
            title: intl.formatMessage({
              id: 'toast.transaction.updateFailed',
              defaultMessage: 'Failed to update transaction',
            }),
            description: formatErrorMessage(intl, message),
            type: 'error',
          });
        },
      },
    );
  }

  return { form, handleOpenChange, handleEditTransaction, isPending, error };
}
