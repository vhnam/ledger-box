import { useEffect, useMemo, useState } from 'react';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';
import { useTransactions } from '#/queries/transactions/transaction.queries';

import { TRANSACTIONS_PAGE_SIZE } from './constants';

type PageItem = number | 'ellipsis';

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 0) {
    return [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];

  if (currentPage > 3) {
    items.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page++) {
    items.push(page);
  }

  if (currentPage < totalPages - 2) {
    items.push('ellipsis');
  }

  items.push(totalPages);

  return items;
}

type UseWalletTransactionsOptions = {
  walletId: string;
  pageSize?: number;
  transactionQuery: Omit<TransactionQueryParams, 'page' | 'pageSize'>;
};

export function useWalletTransactions({
  walletId,
  pageSize = TRANSACTIONS_PAGE_SIZE,
  transactionQuery,
}: UseWalletTransactionsOptions) {
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useTransactions(walletId, { page, pageSize, ...transactionQuery });

  const totalResults = data?.total ?? 0;
  const totalPages = Math.ceil(totalResults / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const pageItems = useMemo(() => getPageItems(safePage, totalPages), [safePage, totalPages]);
  const canGoPrevious = safePage > 1;
  const canGoNext = safePage < totalPages;
  const showPagination = totalPages > 1;
  const resultLabel = totalResults === 1 ? '1 result' : `${totalResults} results`;

  useEffect(() => {
    setPage(1);
  }, [walletId, transactionQuery]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  };

  const goToPreviousPage = () => {
    goToPage(safePage - 1);
  };

  const goToNextPage = () => {
    goToPage(safePage + 1);
  };

  return {
    transactions: data?.items ?? [],
    page: safePage,
    totalPages,
    totalResults,
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
  };
}

export type { PageItem };
