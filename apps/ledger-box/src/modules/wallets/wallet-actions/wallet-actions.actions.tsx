import { getRouteApi } from '@tanstack/react-router';
import { useMemo } from 'react';

import type { DatePickerRangeValue } from '@vhnam/ui/components/date-picker-range';

import { DateFormat, format, formatDate, parseISO, subMonths } from '@vhnam/utils/date';

import { FILTER_OPTIONS, type FilterOptionValue } from '#/constants/filter-options';
import {
  SORT_BY_OPTIONS_LIST,
  SORT_ORDER_OPTIONS_LIST,
  type SortByValue,
  type SortOrderValue,
} from '#/constants/sort-options';

import {
  resolveWalletTransactionSearch,
  type WalletTransactionSearch,
} from '#/schemas/wallet-transaction-search.schema';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';

const walletRouteApi = getRouteApi('/_app/wallets/$walletId/');

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
    // Send calendar dates only; the server resolves bounds in the wallet's timezone
    // (see `resolvePeriodBounds`). Do not pre-convert to ISO instants here.
    query.from = search.from;
    query.to = search.to;
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
      resetScroll: false,
    });
  };

  const locale = useAppLocale();

  const filterPreview = useMemo(() => {
    switch (search.filter) {
      case FILTER_OPTIONS.TODAY:
        return formatDate(new Date(), undefined, locale);
      case FILTER_OPTIONS.THIS_MONTH:
        return formatDate(new Date(), DateFormat.Month, locale);
      case FILTER_OPTIONS.LAST_MONTH:
        return formatDate(subMonths(new Date(), 1), DateFormat.Month, locale);
      default:
        return null;
    }
  }, [search.filter, locale]);

  const isDateRangeFilter = search.filter === FILTER_OPTIONS.DATE_RANGE;
  const dateRange = useMemo(() => toDateRange(search), [search.from, search.to]);
  const transactionQuery = useMemo(() => toTransactionQuery(search), [search]);

  const setFilterBy = (filterBy: FilterOptionValue) => {
    updateSearch({
      filter: filterBy,
      page: undefined,
      ...(filterBy === FILTER_OPTIONS.DATE_RANGE ? {} : { from: undefined, to: undefined }),
    });
  };

  const setDateRange = (range: DatePickerRangeValue | undefined) => {
    updateSearch({
      filter: FILTER_OPTIONS.DATE_RANGE,
      page: undefined,
      from: range?.from ? toIsoDate(range.from) : undefined,
      to: range?.to ? toIsoDate(range.to) : undefined,
    });
  };

  const setSortBy = (sortBy: SortByValue) => {
    updateSearch({ sortBy, page: undefined });
  };

  const setSortOrder = (sortOrder: SortOrderValue) => {
    updateSearch({ sortOrder, page: undefined });
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
