import { useMemo, useState } from 'react';

import type { DatePickerRangeValue } from '@vhnam/ui/components/date-picker-range';
import { DateFormat, formatDate, subMonths } from '@vhnam/utils/date';

import { DEFAULT_FILTER_VALUE, FILTER_OPTIONS, type FilterOptionValue } from '#/constants/filter-options';

export function useWalletActions() {
  const [filterBy, setFilterBy] = useState<FilterOptionValue>(DEFAULT_FILTER_VALUE);
  const [dateRange, setDateRange] = useState<DatePickerRangeValue>();

  const filterPreview = useMemo(() => {
    switch (filterBy) {
      case FILTER_OPTIONS.TODAY:
        return formatDate(new Date());
      case FILTER_OPTIONS.THIS_MONTH:
        return formatDate(new Date(), DateFormat.Month);
      case FILTER_OPTIONS.LAST_MONTH:
        return formatDate(subMonths(new Date(), 1), DateFormat.Month);
      default:
        return null;
    }
  }, [filterBy]);

  const isDateRangeFilter = filterBy === FILTER_OPTIONS.DATE_RANGE;

  return {
    filterBy,
    setFilterBy,
    dateRange,
    setDateRange,
    filterPreview,
    isDateRangeFilter,
  };
}
