import type { FilterOptionValue } from '#/constants/filter-options';
import type { SortByValue, SortOrderValue } from '#/constants/sort-options';

export type TransactionQueryParams = {
  page: number;
  pageSize: number;
  filter?: FilterOptionValue;
  from?: string;
  to?: string;
  sortBy?: SortByValue;
  sortOrder?: SortOrderValue;
};
