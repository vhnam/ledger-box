import { Skeleton } from '@vhnam/ui/components/skeleton';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';

import { WalletEmpty } from '../wallet-empty';
import { WalletPagination } from './wallet-pagination';
import { WalletTransaction } from './wallet-transaction';
import { useWalletTransactions } from './wallet-transactions.actions';

type WalletTransactionsProps = {
  walletId: string;
  transactionQuery: Omit<TransactionQueryParams, 'page' | 'pageSize'>;
};

function WalletTransactions({ walletId, transactionQuery }: WalletTransactionsProps) {
  const {
    transactions,
    page,
    totalPages,
    pageItems,
    canGoPrevious,
    canGoNext,
    showPagination,
    resultLabel,
    isPending,
    isError,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  } = useWalletTransactions({ walletId, transactionQuery });

  return (
    <div className="flex flex-col gap-4">
      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-destructive">Failed to load transactions.</p>}

      {!isPending && !isError && transactions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transactions</span>
            <span className="font-mono text-xs text-muted-foreground">{resultLabel}</span>
          </div>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <WalletTransaction key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </div>
      )}

      {!isPending && !isError && transactions.length === 0 && <WalletEmpty variant="transactions" />}

      {showPagination && (
        <WalletPagination
          page={page}
          totalPages={totalPages}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          pageItems={pageItems}
          goToPage={goToPage}
          goToPreviousPage={goToPreviousPage}
          goToNextPage={goToNextPage}
        />
      )}
    </div>
  );
}

export { WalletTransactions };
