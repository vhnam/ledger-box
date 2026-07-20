import { Button } from '@vhnam/ui/components/button';
import { Dialog, DialogContent } from '@vhnam/ui/components/dialog';
import { FieldError } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@vhnam/ui/components/sheet';
import { Spinner } from '@vhnam/ui/components/spinner';
import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';

import type { TransactionAttachment } from '../transaction-attachments/transaction-attachments-sheet.actions';
import { useDeleteTransactionAttachmentDialogActions } from './delete-transaction-attachment-dialog.actions';

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
        <Button
          type="button"
          variant="destructive"
          className="flex-1 bg-rose-500 hover:bg-rose-500/90"
          onClick={onConfirm}
          disabled={isPending}
        >
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
  const isMobile = useIsMobile();
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

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 rounded-t-2xl px-4 pb-6 pt-2">
          <div className="mx-auto mb-6 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetTitle className="sr-only">Remove attachment?</SheetTitle>
          <SheetDescription className="sr-only">Confirm removal of {attachment.fileName}</SheetDescription>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        {content}
      </DialogContent>
    </Dialog>
  );
}

export { DeleteTransactionAttachmentDialog };
