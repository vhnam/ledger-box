import { useState } from 'react';

import { toast } from '@vhnam/ui/components/toast';

import { useDeleteTransactionAttachment } from '#/queries/transactions/transaction.mutations';

import type { TransactionAttachment } from '../transaction-attachments/transaction-attachments-sheet.actions';

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
          toast.add({ title: 'Attachment removed', type: 'success' });
          onSuccess();
        },
        onError: (removeError) => {
          const message =
            removeError instanceof Error ? removeError.message : 'Failed to remove attachment. Please try again.';
          setError(message);
          toast.add({ title: 'Failed to remove attachment', description: message, type: 'error' });
        },
      },
    );
  }

  return { handleDeleteAttachment, isPending, error };
}
