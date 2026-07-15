import { useMemo } from 'react';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';
import { useTransactions } from '#/queries/transactions/transaction.queries';

const SUMMARY_PAGE_SIZE = 100;

type WalletSummaryStats = {
  income: number;
  expenses: number;
  netBalance: number;
};

type UseWalletSummaryOptions = {
  walletId: string;
  transactionQuery: Omit<TransactionQueryParams, 'page' | 'pageSize'>;
};

function useWalletSummary({ walletId, transactionQuery }: UseWalletSummaryOptions) {
  const { data, isPending, isError } = useTransactions(walletId, {
    page: 1,
    pageSize: SUMMARY_PAGE_SIZE,
    ...transactionQuery,
  });

  const stats = useMemo<WalletSummaryStats>(() => {
    const items = data?.items ?? [];
    let income = 0;
    let expenses = 0;

    for (const transaction of items) {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else {
        expenses += transaction.amount;
      }
    }

    return {
      income,
      expenses,
      netBalance: income - expenses,
    };
  }, [data?.items]);

  return {
    stats,
    isPending,
    isError,
  };
}

export { useWalletSummary };
export type { WalletSummaryStats };
