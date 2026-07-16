import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { cn } from '@vhnam/ui/lib/utils';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { format, toDate } from '@vhnam/utils/date';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

function formatTransactionAttachmentsSubtitle(transaction: TransactionDto) {
  const amount = formatSignedCurrency(transaction.amount, transaction.type);
  const date = format(toDate(transaction.createdAt), 'MMM d, yyyy');

  return `${amount} · ${date}`;
}

type TransactionAttachmentHeaderProps = {
  transaction: TransactionDto;
  onBack?: () => void;
};

function TransactionAttachmentHeader({ transaction, onBack }: TransactionAttachmentHeaderProps) {
  const isExpense = transaction.type === 'expense';

  return (
    <div className="relative border-b px-4 pb-4">
      {onBack ? (
        <Button type="button" variant="ghost" size="icon-sm" className="absolute top-0 left-3" onClick={onBack}>
          <Icon name="ArrowLeftIcon" />
          <span className="sr-only">Back</span>
        </Button>
      ) : null}

      <div className={cn('flex items-start gap-3', onBack ? 'pl-9 pr-8' : 'pr-8')}>
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            isExpense ? 'bg-rose-500' : 'bg-emerald-500',
          )}
        >
          <Icon name={isExpense ? 'ArrowDownIcon' : 'ArrowUpIcon'} className="size-5 text-white" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-medium">{transaction.description}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {formatTransactionAttachmentsSubtitle(transaction)}
          </p>
        </div>
      </div>
    </div>
  );
}

export { TransactionAttachmentHeader };
