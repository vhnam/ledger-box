import { Button } from '@vhnam/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@vhnam/ui/components/dialog';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@vhnam/ui/components/sheet';
import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';
import { cn } from '@vhnam/ui/lib/utils';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { format, toDate } from '@vhnam/utils/date';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

import { getTransactionAmountClassName } from './wallet-transaction.actions';

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
  onClick?: () => void;
  className?: string;
};

type WalletTransactionDetailContentProps = {
  transaction: TransactionDto;
  onEdit: () => void;
  onDelete: () => void;
  onOpenAttachments: () => void;
  className?: string;
};

function formatTransactionDetailDateTime(date: string) {
  return format(toDate(date), 'MMM d, yyyy • h:mm a');
}

function DetailRow({ icon, label, value, onClick, className }: DetailRowProps) {
  const content = (
    <>
      <Icon name={icon} className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn('flex w-full items-center gap-3 text-left transition-colors hover:bg-muted/50', className)}
      >
        {content}
      </button>
    );
  }

  return <div className={cn('flex items-center gap-3', className)}>{content}</div>;
}

function WalletTransactionDetailContent({
  transaction,
  onEdit,
  onDelete,
  onOpenAttachments,
  className,
}: WalletTransactionDetailContentProps) {
  const isExpense = transaction.type === 'expense';
  const typeLabel = isExpense ? 'Expense' : 'Income';

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            isExpense ? 'bg-rose-500' : 'bg-emerald-500',
          )}
        >
          <Icon name={isExpense ? 'ArrowDownIcon' : 'ArrowUpIcon'} className="size-5 text-white" />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isExpense ? 'text-rose-500' : 'text-emerald-500',
            )}
          >
            {typeLabel}
          </p>
          <p className="text-base font-medium">{transaction.description}</p>
        </div>
      </div>

      <p className={cn('mt-4', getTransactionAmountClassName(transaction.type, 'xl'))}>
        {formatSignedCurrency(transaction.amount, transaction.type, { notation: 'standard' })}
      </p>

      <div className="mt-6 divide-y rounded-xl border bg-muted/30">
        <DetailRow
          icon="CalendarBlankIcon"
          label="Date & Time"
          value={formatTransactionDetailDateTime(transaction.createdAt)}
          className="p-4"
        />
        <DetailRow icon="PaperclipIcon" label="Attachments" value="None" onClick={onOpenAttachments} className="p-4" />
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
    </div>
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

  const content = (
    <WalletTransactionDetailContent
      transaction={transaction}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onOpenAttachments={handleOpenAttachments}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="gap-0 rounded-t-2xl px-4 pb-6 pt-2">
          <SheetTitle className="sr-only">Transaction details</SheetTitle>
          <SheetDescription className="sr-only">Details for {transaction.description}</SheetDescription>
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <div className="pr-8">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Transaction details</DialogTitle>
        <DialogDescription className="sr-only">Details for {transaction.description}</DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export { WalletTransactionDetailSheet };
