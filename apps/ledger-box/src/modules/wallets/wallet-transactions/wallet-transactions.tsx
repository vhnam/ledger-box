import { Skeleton } from '@vhnam/ui/components/skeleton';

import { WalletEmpty } from '#/modules/wallets/wallet-empty';
import { WalletPagination } from '#/modules/wallets/wallet-transactions/wallet-pagination';
import { WalletTransaction } from '#/modules/wallets/wallet-transactions/wallet-transaction';
import { useWalletTransactions } from '#/modules/wallets/wallet-transactions/wallet-transactions.actions';
import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';

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
            <span className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Transactions
            </span>
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
