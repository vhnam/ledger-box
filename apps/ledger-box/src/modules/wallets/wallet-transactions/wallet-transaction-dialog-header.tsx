import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { cn } from '@vhnam/ui/lib/utils';

import { formatSignedCurrency } from '@vhnam/utils/currency';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

import { getTransactionAmountClassName } from './wallet-transaction.actions';

type TransactionDialogHeaderProps = {
  transaction: TransactionDto;
  onBack?: () => void;
  onClose?: () => void;
  bordered?: boolean;
  className?: string;
};

function TransactionDialogHeader({
  transaction,
  onBack,
  onClose,
  bordered = false,
  className,
}: TransactionDialogHeaderProps) {
  const isExpense = transaction.type === 'expense';
  const typeLabel = isExpense ? 'Expense' : 'Income';

  return (
    <div className={cn(bordered && 'border-b', className)}>
      <div className="flex items-start gap-2 px-4 pt-4">
        {onBack ? (
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onBack}>
            <Icon name="ArrowLeftIcon" />
            <span className="sr-only">Back</span>
          </Button>
        ) : null}

        <div className="flex min-w-0 flex-1 items-start gap-3">
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
            <p className="text-base font-medium leading-snug">{transaction.description}</p>
          </div>
        </div>

        {onClose ? (
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose}>
            <Icon name="XIcon" />
            <span className="sr-only">Close</span>
          </Button>
        ) : null}
      </div>

      <p className={cn('mt-4 px-4 pb-4', getTransactionAmountClassName(transaction.type, 'xl'))}>
        {formatSignedCurrency(transaction.amount, transaction.type, { notation: 'standard' })}
      </p>
    </div>
  );
}

export { TransactionDialogHeader };
