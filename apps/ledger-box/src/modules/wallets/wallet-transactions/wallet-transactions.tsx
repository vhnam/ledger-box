import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@vhnam/ui/components/pagination';
import { Spinner } from '@vhnam/ui/components/spinner';
import { cn } from '@vhnam/ui/lib/utils';
import { DateTimeFormat, formatDateTime } from '@vhnam/utils/date';

import { WalletEmpty } from '../wallet-empty';
import { useWalletTransactions } from './wallet-transactions.actions';

type WalletTransactionsProps = {
  walletId: string;
};

function WalletTransactions({ walletId }: WalletTransactionsProps) {
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
  } = useWalletTransactions({ walletId });

  return (
    <div className="flex flex-col gap-4">
      {isPending ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      ) : null}

      {isError ? <p className="text-sm text-destructive">Failed to load transactions.</p> : null}

      {!isPending && !isError && transactions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transactions</span>
            <span className="font-mono text-xs text-muted-foreground">{resultLabel}</span>
          </div>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 px-4 py-3 border rounded-lg bg-card"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(transaction.datetime, DateTimeFormat.Numeric)}
                  </p>
                </div>
                <p
                  className={cn(
                    'shrink-0 font-mono text-sm font-medium',
                    transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500',
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {transaction.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!isPending && !isError && transactions.length === 0 ? <WalletEmpty variant="transactions" /> : null}

      {showPagination ? (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={!canGoPrevious}
                  className={cn(!canGoPrevious && 'pointer-events-none opacity-50')}
                  onClick={(event) => {
                    event.preventDefault();
                    goToPreviousPage();
                  }}
                />
              </PaginationItem>

              {pageItems.map((item, index) => (
                <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
                  {item === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={!canGoNext}
                  className={cn(!canGoNext && 'pointer-events-none opacity-50')}
                  onClick={(event) => {
                    event.preventDefault();
                    goToNextPage();
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}

export { WalletTransactions };
