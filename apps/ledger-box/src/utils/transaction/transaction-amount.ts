import { cn } from '@vhnam/ui/lib/cn';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

export const getTransactionAmountClassName = (type: TransactionDto['type'], size: 'sm' | 'xl' = 'sm') => {
  return cn(
    'font-mono',
    size === 'sm' ? 'shrink-0 text-sm font-medium flex items-center justify-end' : 'text-3xl font-semibold',
    type === 'income' ? 'text-emerald-500' : 'text-rose-500',
  );
};
