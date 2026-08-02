import { Button } from '@vhnam/ui/components/button';
import { FieldError } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';

import { useDeleteTransactionAttachmentDialogActions } from '#/modules/wallets/wallet-delete-transaction-attachment-dialog/wallet-delete-transaction-attachment-dialog.actions';
import type { TransactionAttachment } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachments-sheet.actions';

type DeleteTransactionAttachmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: TransactionAttachment | null;
  walletId: string;
  transactionId: string;
  onRemovePending: (attachmentId: string) => void;
};

type DeleteTransactionAttachmentContentProps = {
  attachment: TransactionAttachment;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteTransactionAttachmentContent({
  attachment,
  isPending,
  error,
  onCancel,
  onConfirm,
}: DeleteTransactionAttachmentContentProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <Icon name="TrashIcon" className="size-6 text-destructive" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Remove attachment?</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">&quot;{attachment.fileName}&quot;</span> will be permanently
          removed.
          <br />
          This can&apos;t be undone.
        </p>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex w-full gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" className="flex-1" onClick={onConfirm} disabled={isPending}>
          {isPending ? <Spinner className="size-4" /> : null}
          {isPending ? 'Removing...' : 'Remove'}
        </Button>
      </div>
    </div>
  );
}

function DeleteTransactionAttachmentDialog({
  open,
  onOpenChange,
  attachment,
  walletId,
  transactionId,
  onRemovePending,
}: DeleteTransactionAttachmentDialogProps) {
  const { handleDeleteAttachment, isPending, error } = useDeleteTransactionAttachmentDialogActions({
    walletId,
    transactionId,
    attachment,
    onRemovePending,
  });

  if (!attachment) {
    return null;
  }

  function handleCancel() {
    onOpenChange(false);
  }

  function handleConfirm() {
    handleDeleteAttachment(() => {
      onOpenChange(false);
    });
  }

  const content = (
    <DeleteTransactionAttachmentContent
      attachment={attachment}
      isPending={isPending}
      error={error}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove attachment?"
      description={`Confirm removal of ${attachment.fileName}`}
      hideTitle
      hideDescription
      showCloseButton={false}
      headerClassName="sr-only"
      className="sm:max-w-md"
    >
      {content}
    </ResponsiveDialog>
  );
}

export { DeleteTransactionAttachmentDialog };
