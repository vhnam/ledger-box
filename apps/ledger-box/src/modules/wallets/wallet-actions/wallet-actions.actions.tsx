import { getRouteApi } from '@tanstack/react-router';
import { useMemo } from 'react';

import type { DatePickerRangeValue } from '@vhnam/ui/components/date-picker-range';

import { DateFormat, endOfDay, format, formatDate, parseISO, startOfDay, subMonths } from '@vhnam/utils/date';

import { FILTER_OPTIONS, type FilterOptionValue } from '#/constants/filter-options';
import {
  SORT_BY_OPTIONS_LIST,
  SORT_ORDER_OPTIONS_LIST,
  type SortByValue,
  type SortOrderValue,
} from '#/constants/sort-options';
import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';
import {
  resolveWalletTransactionSearch,
  type WalletTransactionSearch,
} from '#/schemas/wallet-transaction-search.schema';

const walletRouteApi = getRouteApi('/_app/wallets/$walletId');

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function toDateRange(search: WalletTransactionSearch): DatePickerRangeValue | undefined {
  if (!search.from || !search.to) {
    return undefined;
  }

  return {
    from: parseISO(search.from),
    to: parseISO(search.to),
  };
}

function toTransactionQuery(search: WalletTransactionSearch): Omit<TransactionQueryParams, 'page' | 'pageSize'> {
  const query: Omit<TransactionQueryParams, 'page' | 'pageSize'> = {
    filter: search.filter,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
  };

  if (search.filter === FILTER_OPTIONS.DATE_RANGE && search.from && search.to) {
    query.from = startOfDay(parseISO(search.from)).toISOString();
    query.to = endOfDay(parseISO(search.to)).toISOString();
  }

  return query;
}

export function useWalletActions() {
  const search = walletRouteApi.useSearch();
  const navigate = walletRouteApi.useNavigate();

  const updateSearch = (next: Partial<WalletTransactionSearch>) => {
    void navigate({
      search: (prev) => resolveWalletTransactionSearch({ ...prev, ...next }),
      replace: true,
    });
  };

  const filterPreview = useMemo(() => {
    switch (search.filter) {
      case FILTER_OPTIONS.TODAY:
        return formatDate(new Date());
      case FILTER_OPTIONS.THIS_MONTH:
        return formatDate(new Date(), DateFormat.Month);
      case FILTER_OPTIONS.LAST_MONTH:
        return formatDate(subMonths(new Date(), 1), DateFormat.Month);
      default:
        return null;
    }
  }, [search.filter]);

  const isDateRangeFilter = search.filter === FILTER_OPTIONS.DATE_RANGE;
  const dateRange = useMemo(() => toDateRange(search), [search.from, search.to]);
  const transactionQuery = useMemo(() => toTransactionQuery(search), [search]);

  const setFilterBy = (filterBy: FilterOptionValue) => {
    updateSearch({
      filter: filterBy,
      ...(filterBy === FILTER_OPTIONS.DATE_RANGE ? {} : { from: undefined, to: undefined }),
    });
  };

  const setDateRange = (range: DatePickerRangeValue | undefined) => {
    updateSearch({
      filter: FILTER_OPTIONS.DATE_RANGE,
      from: range?.from ? toIsoDate(range.from) : undefined,
      to: range?.to ? toIsoDate(range.to) : undefined,
    });
  };

  const setSortBy = (sortBy: SortByValue) => {
    updateSearch({ sortBy });
  };

  const setSortOrder = (sortOrder: SortOrderValue) => {
    updateSearch({ sortOrder });
  };

  return {
    filterBy: search.filter,
    setFilterBy,
    dateRange,
    setDateRange,
    filterPreview,
    isDateRangeFilter,
    sortBy: search.sortBy,
    setSortBy,
    sortOrder: search.sortOrder,
    setSortOrder,
    sortByOptions: SORT_BY_OPTIONS_LIST,
    sortOrderOptions: SORT_ORDER_OPTIONS_LIST,
    transactionQuery,
  };
}
