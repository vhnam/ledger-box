import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';
import { useWalletSummaryQuery } from '#/queries/wallet-summary/wallet-summary.queries';

type WalletSummaryStats = {
  income: number;
  expenses: number;
  netBalance: number;
};

type UseWalletSummaryOptions = {
  walletId: string;
  transactionQuery: Pick<TransactionQueryParams, 'filter' | 'from' | 'to'>;
};

// Totals are computed by a server-side aggregate over the full period (see
// `#/lib/wallet-summary.ts`), not by reducing a paginated page of transactions — a paginated
// reduce silently truncated totals for any period with more than one page of transactions.
function useWalletSummary({ walletId, transactionQuery }: UseWalletSummaryOptions) {
  const { data, isPending, isError } = useWalletSummaryQuery(walletId, transactionQuery);

  const stats: WalletSummaryStats = data ?? { income: 0, expenses: 0, netBalance: 0 };

  return {
    stats,
    isPending,
    isError,
  };
}

export { useWalletSummary };
export type { WalletSummaryStats };
