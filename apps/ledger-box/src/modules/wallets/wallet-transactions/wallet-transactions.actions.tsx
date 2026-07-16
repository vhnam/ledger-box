import { getRouteApi } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';
import { useTransactions } from '#/queries/transactions/transaction.queries';
import { resolveWalletTransactionSearch } from '#/schemas/wallet-transaction-search.schema';

const TRANSACTIONS_PAGE_SIZE = 10;

type PageItem = number | 'ellipsis';

const walletRouteApi = getRouteApi('/_app/wallets/$walletId');

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
  const search = walletRouteApi.useSearch();
  const navigate = walletRouteApi.useNavigate();
  const page = search.page;
  const prevWalletIdRef = useRef(walletId);

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
    if (prevWalletIdRef.current === walletId) {
      return;
    }

    prevWalletIdRef.current = walletId;

    if (page !== 1) {
      void navigate({
        search: (prev) => resolveWalletTransactionSearch({ ...prev, page: undefined }),
        replace: true,
        resetScroll: false,
      });
    }
  }, [walletId, page, navigate]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      void navigate({
        search: (prev) => resolveWalletTransactionSearch({ ...prev, page: totalPages === 1 ? undefined : totalPages }),
        replace: true,
        resetScroll: false,
      });
    }
  }, [page, totalPages, navigate]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    void navigate({
      search: (prev) =>
        resolveWalletTransactionSearch({
          ...prev,
          page: nextPage === 1 ? undefined : nextPage,
        }),
      replace: true,
      resetScroll: false,
    });
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
