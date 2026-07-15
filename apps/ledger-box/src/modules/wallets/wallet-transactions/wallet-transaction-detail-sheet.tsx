import { Button } from '@vhnam/ui/components/button';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { Sheet, SheetContent } from '@vhnam/ui/components/sheet';
import { cn } from '@vhnam/ui/lib/utils';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { format, toDate } from '@vhnam/utils/date';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

import { getTransactionAmountClassName } from './wallet-transaction.actions';

type WalletTransactionDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDto;
  onEdit: () => void;
  onDelete: () => void;
};

type DetailRowProps = {
  icon: IconName;
  label: string;
  value: string;
};

function formatTransactionDetailDateTime(date: string) {
  return format(toDate(date), 'MMM d, yyyy • h:mm a');
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
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
}: WalletTransactionDetailSheetProps) {
  const isExpense = transaction.type === 'expense';
  const typeLabel = isExpense ? 'Expense' : 'Income';

  function handleEdit() {
    onOpenChange(false);
    onEdit();
  }

  function handleDelete() {
    onOpenChange(false);
    onDelete();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-2xl px-4 pb-6 pt-2">
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />

        <div className="flex items-start gap-3 pr-8">
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

        <div className="mt-6 space-y-4 rounded-xl border bg-muted/30 p-4">
          <DetailRow
            icon="CalendarBlankIcon"
            label="Date & Time"
            value={formatTransactionDetailDateTime(transaction.createdAt)}
          />
          <DetailRow icon="PaperclipIcon" label="Attachments" value="None" />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Button type="button" variant="outline" className="flex-1">
            <Icon name="PaperclipIcon" />
            Attachments
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={handleEdit}>
            <Icon name="PencilLineIcon" />
            Edit
          </Button>
          <Button type="button" variant="destructive" size="icon-lg" className="shrink-0" onClick={handleDelete}>
            <Icon name="TrashIcon" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { WalletTransactionDetailSheet };
