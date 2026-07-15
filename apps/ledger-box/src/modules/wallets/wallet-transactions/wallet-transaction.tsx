import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { cn } from '@vhnam/ui/lib/utils';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { DateTimeFormat, formatDateTime } from '@vhnam/utils/date';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

type WalletTransactionProps = {
  transaction: TransactionDto;
};

function WalletTransaction({ transaction }: WalletTransactionProps) {
  return (
    <div
      key={transaction.id}
      className="gap-4 px-4 py-3 border rounded-lg bg-card hover:bg-card/70 hover:border-border/60 transition-all duration-100 select-none"
    >
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{transaction.description}</p>
          <p className="text-xs font-mono text-muted-foreground">
            {formatDateTime(transaction.createdAt, DateTimeFormat.Numeric)}
          </p>
        </div>
        <p
          className={cn(
            'shrink-0 font-mono text-sm font-medium flex items-center justify-end',
            transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500',
          )}
        >
          {formatSignedCurrency(transaction.amount, transaction.type)}
        </p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon">
            <Icon name="DotsThreeVerticalIcon" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { WalletTransaction };
