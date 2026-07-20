import { useState } from 'react';

import { toast } from '@vhnam/ui/components/sonner';

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
          toast.success('Attachment removed');
          onSuccess();
        },
        onError: (removeError) => {
          const message =
            removeError instanceof Error ? removeError.message : 'Failed to remove attachment. Please try again.';
          setError(message);
          toast.error('Failed to remove attachment', { description: message });
        },
      },
    );
  }

  return { handleDeleteAttachment, isPending, error };
}
