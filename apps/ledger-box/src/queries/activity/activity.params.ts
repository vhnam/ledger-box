import type { FilterOptionValue } from '#/constants/filter-options';

export type ActivityQueryParams = {
  page: number;
  pageSize?: number;
  filter?: FilterOptionValue;
  from?: string;
  to?: string;
};
