import { getRouteApi } from '@tanstack/react-router';
import { useMemo } from 'react';

import type { DatePickerRangeValue } from '@vhnam/ui/components/date-picker-range';

import { DateFormat, format, formatDate, getThisWeekRange, parseISO, subMonths } from '@vhnam/utils/date';

import { ACTIVITY_FILTER_OPTIONS_LIST, FILTER_OPTIONS, type FilterOptionValue } from '#/constants/filter-options';

import { resolveWalletActivitySearch, type WalletActivitySearch } from '#/schemas/wallet-activity-search.schema';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { ActivityQueryParams } from '#/queries/activity/activity.params';

const activitiesRouteApi = getRouteApi('/_app/wallets/$walletId/settings/activities');

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function toDateRange(search: WalletActivitySearch): DatePickerRangeValue | undefined {
  if (!search.from || !search.to) {
    return undefined;
  }

  return {
    from: parseISO(search.from),
    to: parseISO(search.to),
  };
}

function toActivityQuery(search: WalletActivitySearch): ActivityQueryParams {
  const query: ActivityQueryParams = {
    page: search.page,
    filter: search.filter,
  };

  if (search.filter === FILTER_OPTIONS.DATE_RANGE && search.from && search.to) {
    query.from = search.from;
    query.to = search.to;
  }

  return query;
}

function mondayOfLocalWeek(reference: Date): Date {
  const day = reference.getDay();
  const isoDow = day === 0 ? 7 : day;
  const monday = new Date(reference);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (isoDow - 1));

  return monday;
}

export function useWalletSettingsActivitiesFilters() {
  const search = activitiesRouteApi.useSearch();
  const navigate = activitiesRouteApi.useNavigate();
  const locale = useAppLocale();

  const updateSearch = (next: Partial<WalletActivitySearch>) => {
    void navigate({
      search: (prev) => resolveWalletActivitySearch({ ...prev, ...next }),
      replace: true,
      resetScroll: false,
    });
  };

  const filterPreview = useMemo(() => {
    switch (search.filter) {
      case FILTER_OPTIONS.TODAY:
        return formatDate(new Date(), DateFormat.Medium, locale);
      case FILTER_OPTIONS.THIS_WEEK: {
        const monday = mondayOfLocalWeek(new Date());
        return formatDate(monday, DateFormat.Medium, locale);
      }
      case FILTER_OPTIONS.LAST_WEEK: {
        const monday = mondayOfLocalWeek(new Date());
        monday.setDate(monday.getDate() - 7);
        return formatDate(monday, DateFormat.Medium, locale);
      }
      case FILTER_OPTIONS.THIS_MONTH:
        return formatDate(new Date(), DateFormat.MonthMedium, locale);
      case FILTER_OPTIONS.LAST_MONTH:
        return formatDate(subMonths(new Date(), 1), DateFormat.MonthMedium, locale);
      default:
        return null;
    }
  }, [search.filter, locale]);

  const isDateRangeFilter = search.filter === FILTER_OPTIONS.DATE_RANGE;
  const dateRange = useMemo(() => toDateRange(search), [search.from, search.to]);
  const activityQuery = useMemo(() => toActivityQuery(search), [search]);

  const setFilterBy = (filterBy: FilterOptionValue) => {
    if (filterBy === FILTER_OPTIONS.DATE_RANGE) {
      const week = getThisWeekRange();

      updateSearch({
        filter: filterBy,
        page: undefined,
        from: toIsoDate(week.start),
        to: toIsoDate(week.end),
      });

      return;
    }

    updateSearch({
      filter: filterBy,
      page: undefined,
      from: undefined,
      to: undefined,
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

  const setPage = (page: number) => {
    updateSearch({ page });
  };

  return {
    filterBy: search.filter,
    setFilterBy,
    dateRange,
    setDateRange,
    filterPreview,
    isDateRangeFilter,
    filterOptions: ACTIVITY_FILTER_OPTIONS_LIST,
    page: search.page,
    setPage,
    activityQuery,
  };
}
