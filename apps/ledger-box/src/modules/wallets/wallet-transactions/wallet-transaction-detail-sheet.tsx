import { Button } from '@vhnam/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@vhnam/ui/components/dialog';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@vhnam/ui/components/sheet';
import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';
import { cn } from '@vhnam/ui/lib/utils';

import { format, toDate } from '@vhnam/utils/date';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useTransactionAttachments } from '#/queries/transactions/transaction.queries';

import { TransactionDialogHeader } from './wallet-transaction-dialog-header';

type WalletTransactionDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDto;
  onEdit: (options?: { returnToDetail?: boolean }) => void;
  onDelete: () => void;
  onOpenAttachments: (options?: { returnToDetail?: boolean }) => void;
};

type DetailRowProps = {
  icon: IconName;
  label: string;
  value: string;
  className?: string;
};

type AttachmentsDetailRowProps = {
  count: number;
  isLoading: boolean;
  isError: boolean;
  onView: () => void;
  className?: string;
};

function formatAttachmentCount(count: number) {
  if (count === 0) {
    return 'None';
  }

  if (count === 1) {
    return '1 file';
  }

  return `${count} files`;
}

function formatTransactionDetailDateTime(date: string) {
  return format(toDate(date), 'MMM d, yyyy • h:mm a');
}

function DetailRow({ icon, label, value, className }: DetailRowProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Icon name={icon} className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
    </div>
  );
}

function AttachmentsDetailRow({ count, isLoading, isError, onView, className }: AttachmentsDetailRowProps) {
  const value = isLoading ? 'Loading...' : isError ? 'Failed to load' : formatAttachmentCount(count);
  const showView = !isLoading && !isError && count > 0;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Icon name="PaperclipIcon" className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Attachments</p>
        <p className="truncate text-sm">{value}</p>
      </div>
      {showView ? (
        <button type="button" onClick={onView} className="shrink-0 text-sm underline underline-offset-4">
          View
        </button>
      ) : null}
    </div>
  );
}

type WalletTransactionDetailContentProps = {
  open: boolean;
  transaction: TransactionDto;
  onEdit: () => void;
  onDelete: () => void;
  onOpenAttachments: () => void;
};

function WalletTransactionDetailContent({
  open,
  transaction,
  onEdit,
  onDelete,
  onOpenAttachments,
}: WalletTransactionDetailContentProps) {
  const {
    data,
    isLoading: isAttachmentsLoading,
    isError: isAttachmentsError,
  } = useTransactionAttachments(transaction.walletId, transaction.id, open);

  const attachmentCount = data?.attachments.length ?? 0;

  return (
    <>
      <div className="mt-6 divide-y rounded-xl border bg-muted/30">
        <DetailRow
          icon="CalendarBlankIcon"
          label="Date & Time"
          value={formatTransactionDetailDateTime(transaction.createdAt)}
          className="p-4"
        />
        <AttachmentsDetailRow
          count={attachmentCount}
          isLoading={isAttachmentsLoading}
          isError={isAttachmentsError}
          onView={onOpenAttachments}
          className="p-4"
        />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onOpenAttachments}>
          <Icon name="PaperclipIcon" />
          Attachments
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={onEdit}>
          <Icon name="PencilLineIcon" />
          Edit
        </Button>
        <Button type="button" variant="destructive" size="icon-lg" className="shrink-0" onClick={onDelete}>
          <Icon name="TrashIcon" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </>
  );
}

function WalletTransactionDetailSheet({
  open,
  onOpenChange,
  transaction,
  onEdit,
  onDelete,
  onOpenAttachments,
}: WalletTransactionDetailSheetProps) {
  const isMobile = useIsMobile();

  function handleEdit() {
    onOpenChange(false);
    onEdit({ returnToDetail: true });
  }

  function handleDelete() {
    onOpenChange(false);
    onDelete();
  }

  function handleOpenAttachments() {
    onOpenChange(false);
    onOpenAttachments({ returnToDetail: true });
  }

  const header = <TransactionDialogHeader transaction={transaction} onClose={() => onOpenChange(false)} />;

  const content = (
    <WalletTransactionDetailContent
      open={open}
      transaction={transaction}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onOpenAttachments={handleOpenAttachments}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 rounded-t-2xl px-0 pb-6 pt-2">
          <SheetTitle className="sr-only">Transaction details</SheetTitle>
          <SheetDescription className="sr-only">Details for {transaction.description}</SheetDescription>
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          {header}
          <div className="px-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogTitle className="sr-only">Transaction details</DialogTitle>
        <DialogDescription className="sr-only">Details for {transaction.description}</DialogDescription>
        {header}
        <div className="px-4 pb-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
}

export { WalletTransactionDetailSheet };
