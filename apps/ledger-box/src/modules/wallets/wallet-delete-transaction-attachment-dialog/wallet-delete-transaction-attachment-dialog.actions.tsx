import { useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import { formatErrorMessage } from '#/lib/intl-message';
import type { TransactionAttachment } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachments-sheet.actions';
import { useDeleteTransactionAttachment } from '#/queries/transactions/transaction.mutations';

type UseDeleteTransactionAttachmentDialogActionsOptions = {
  walletId: string;
  transactionId: string;
  attachment: TransactionAttachment | null;
  onRemovePending: (attachmentId: string) => void;
};

export function useDeleteTransactionAttachmentDialogActions({
  walletId,
  transactionId,
  attachment,
  onRemovePending,
}: UseDeleteTransactionAttachmentDialogActionsOptions) {
  const intl = useIntl();
  const { mutate: deleteAttachment, isPending } = useDeleteTransactionAttachment();
  const [error, setError] = useState<string | null>(null);

  function handleDeleteAttachment(onSuccess: () => void) {
    if (!attachment) {
      return;
    }

    setError(null);

    if (!attachment.isRemote) {
      onRemovePending(attachment.id);
      onSuccess();
      return;
    }

    deleteAttachment(
      {
        walletId,
        transactionId,
        attachmentId: attachment.id,
      },
      {
        onSuccess: () => {
          toast.add({
            title: intl.formatMessage({ id: 'toast.attachment.removed', defaultMessage: 'Attachment removed' }),
            type: 'success',
          });
          onSuccess();
        },
        onError: (removeError) => {
          const message = removeError instanceof Error ? removeError.message : 'attachment.delete.errorFallback';
          setError(message);
          toast.add({
            title: intl.formatMessage({
              id: 'toast.attachment.removeFailed',
              defaultMessage: 'Failed to remove attachment',
            }),
            description: formatErrorMessage(intl, message),
            type: 'error',
          });
        },
      },
    );
  }

  return { handleDeleteAttachment, isPending, error };
}
