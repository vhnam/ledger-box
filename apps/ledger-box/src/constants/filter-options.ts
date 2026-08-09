export const FILTER_OPTIONS = {
  ALL_TIME: 'all-time',
  TODAY: 'today',
  THIS_WEEK: 'this-week',
  LAST_WEEK: 'last-week',
  THIS_MONTH: 'this-month',
  LAST_MONTH: 'last-month',
  DATE_RANGE: 'date-range',
} as const;

export const FILTER_OPTIONS_LIST = [
  { labelId: 'filter.allTime', defaultLabel: 'All time', value: FILTER_OPTIONS.ALL_TIME },
  { labelId: 'filter.today', defaultLabel: 'Today', value: FILTER_OPTIONS.TODAY },
  { labelId: 'filter.thisMonth', defaultLabel: 'This month', value: FILTER_OPTIONS.THIS_MONTH },
  { labelId: 'filter.lastMonth', defaultLabel: 'Last month', value: FILTER_OPTIONS.LAST_MONTH },
  { labelId: 'filter.dateRange', defaultLabel: 'Date range', value: FILTER_OPTIONS.DATE_RANGE },
] as const;

/** Period presets for wallet activity (includes week windows; transaction page list stays unchanged). */
export const ACTIVITY_FILTER_OPTIONS_LIST = [
  { labelId: 'filter.allTime', defaultLabel: 'All time', value: FILTER_OPTIONS.ALL_TIME },
  { labelId: 'filter.today', defaultLabel: 'Today', value: FILTER_OPTIONS.TODAY },
  { labelId: 'filter.thisWeek', defaultLabel: 'This week', value: FILTER_OPTIONS.THIS_WEEK },
  { labelId: 'filter.lastWeek', defaultLabel: 'Last week', value: FILTER_OPTIONS.LAST_WEEK },
  { labelId: 'filter.thisMonth', defaultLabel: 'This month', value: FILTER_OPTIONS.THIS_MONTH },
  { labelId: 'filter.lastMonth', defaultLabel: 'Last month', value: FILTER_OPTIONS.LAST_MONTH },
  { labelId: 'filter.dateRange', defaultLabel: 'Date range', value: FILTER_OPTIONS.DATE_RANGE },
] as const;

export type FilterOptionValue = (typeof FILTER_OPTIONS)[keyof typeof FILTER_OPTIONS];

export const DEFAULT_FILTER_VALUE: FilterOptionValue = FILTER_OPTIONS.ALL_TIME;
