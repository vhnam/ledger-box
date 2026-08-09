import * as v from 'valibot';

import { DEFAULT_FILTER_VALUE, FILTER_OPTIONS, type FilterOptionValue } from '#/constants/filter-options';

const filterValues = Object.values(FILTER_OPTIONS);

export const walletActivitySearchSchema = v.object({
  filter: v.optional(v.picklist(filterValues)),
  from: v.optional(v.pipe(v.string(), v.isoDate())),
  to: v.optional(v.pipe(v.string(), v.isoDate())),
  page: v.optional(v.pipe(v.union([v.string(), v.number()]), v.transform(Number), v.integer(), v.minValue(1))),
});

export type WalletActivitySearchInput = v.InferOutput<typeof walletActivitySearchSchema>;

export type WalletActivitySearch = {
  filter: FilterOptionValue;
  from?: string;
  to?: string;
  page: number;
};

export const WALLET_ACTIVITY_SEARCH_DEFAULTS = {
  filter: DEFAULT_FILTER_VALUE,
  page: 1,
} as const;

export function resolveWalletActivitySearch(search: WalletActivitySearchInput): WalletActivitySearch {
  const filter = search.filter ?? DEFAULT_FILTER_VALUE;

  return {
    filter,
    from: filter === FILTER_OPTIONS.DATE_RANGE ? search.from : undefined,
    to: filter === FILTER_OPTIONS.DATE_RANGE ? search.to : undefined,
    page: search.page ?? 1,
  };
}
