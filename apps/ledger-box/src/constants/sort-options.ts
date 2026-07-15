export const SORT_BY_OPTIONS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  AMOUNT: 'amount',
} as const;

export const SORT_BY_OPTIONS_LIST = [
  { label: 'Created at', value: SORT_BY_OPTIONS.CREATED_AT },
  { label: 'Updated at', value: SORT_BY_OPTIONS.UPDATED_AT },
  { label: 'Amount', value: SORT_BY_OPTIONS.AMOUNT },
] as const;

export type SortByValue = (typeof SORT_BY_OPTIONS)[keyof typeof SORT_BY_OPTIONS];

export const SORT_ORDER_OPTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const SORT_ORDER_OPTIONS_LIST = [
  { label: 'Ascending', value: SORT_ORDER_OPTIONS.ASC },
  { label: 'Descending', value: SORT_ORDER_OPTIONS.DESC },
] as const;

export type SortOrderValue = (typeof SORT_ORDER_OPTIONS)[keyof typeof SORT_ORDER_OPTIONS];

export const DEFAULT_SORT_BY: SortByValue = SORT_BY_OPTIONS.CREATED_AT;
export const DEFAULT_SORT_ORDER: SortOrderValue = SORT_ORDER_OPTIONS.DESC;
