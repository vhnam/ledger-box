import * as v from 'valibot';

import { DEFAULT_FILTER_VALUE, FILTER_OPTIONS, type FilterOptionValue } from '#/constants/filter-options';
import {
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
  type SortByValue,
  type SortOrderValue,
} from '#/constants/sort-options';

const filterValues = Object.values(FILTER_OPTIONS);
const sortByValues = Object.values(SORT_BY_OPTIONS);
const sortOrderValues = Object.values(SORT_ORDER_OPTIONS);

export const walletTransactionSearchSchema = v.object({
  filter: v.optional(v.picklist(filterValues)),
  from: v.optional(v.pipe(v.string(), v.isoDate())),
  to: v.optional(v.pipe(v.string(), v.isoDate())),
  sortBy: v.optional(v.picklist(sortByValues)),
  sortOrder: v.optional(v.picklist(sortOrderValues)),
});

export type WalletTransactionSearchInput = v.InferOutput<typeof walletTransactionSearchSchema>;

export type WalletTransactionSearch = {
  filter: FilterOptionValue;
  from?: string;
  to?: string;
  sortBy: SortByValue;
  sortOrder: SortOrderValue;
};

export const WALLET_TRANSACTION_SEARCH_DEFAULTS = {
  filter: DEFAULT_FILTER_VALUE,
  sortBy: DEFAULT_SORT_BY,
  sortOrder: DEFAULT_SORT_ORDER,
} as const;

export function resolveWalletTransactionSearch(search: WalletTransactionSearchInput): WalletTransactionSearch {
  return {
    filter: search.filter ?? DEFAULT_FILTER_VALUE,
    from: search.from,
    to: search.to,
    sortBy: search.sortBy ?? DEFAULT_SORT_BY,
    sortOrder: search.sortOrder ?? DEFAULT_SORT_ORDER,
  };
}
