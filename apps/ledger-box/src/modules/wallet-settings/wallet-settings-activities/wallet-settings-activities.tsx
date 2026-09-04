import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';
import { Skeleton } from '@vhnam/ui/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@vhnam/ui/components/ui/toggle-group';
import { cn } from '@vhnam/ui/lib/cn';

import { getPageItems } from '#/utils/pagination';

import { useAppLocale } from '#/lib/locale/locale-context';

import { useWalletActivity } from '#/queries/activity/activity.queries';

import { AppPagination } from '#/components/app-pagination';
import { WalletEmpty } from '#/components/wallet-empty';

import { useWalletSettingsActivitiesFilters } from './wallet-settings-activities.actions';
import { WalletSettingsActivity } from './wallet-settings-activity';

type WalletSettingsActivitiesProps = {
  walletId: string;
  currency: string;
};

function WalletSettingsActivities({ walletId, currency }: WalletSettingsActivitiesProps) {
  const intl = useIntl();
  const locale = useAppLocale();
  const {
    filterBy,
    setFilterBy,
    dateRange,
    setDateRange,
    filterPreview,
    isDateRangeFilter,
    filterOptions,
    page,
    setPage,
    activityQuery,
  } = useWalletSettingsActivitiesFilters();
  const { data, isPending, isError } = useWalletActivity(walletId, activityQuery, true);
  const totalResults = data?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const showPagination = totalPages > 1;
  const resultLabel =
    totalResults === 1
      ? intl.formatMessage({ id: 'wallet.settings.activities.resultOne', defaultMessage: '1 result' })
      : intl.formatMessage(
          { id: 'wallet.settings.activities.resultOther', defaultMessage: '{count} results' },
          { count: totalResults },
        );

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="font-display text-2xl font-semibold">
          <FormattedMessage id="wallet.settings.activities.title" defaultMessage="Activities" />
        </h1>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="wallet.settings.activities.description"
            defaultMessage="Audit trail of changes to this wallet. Entries are never edited or deleted."
          />
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground">
            <FormattedMessage id="wallet.actions.period" defaultMessage="Period" />
          </p>
          <ToggleGroup
            value={[filterBy]}
            onValueChange={(values) => {
              const nextValue = values.at(-1);
              if (!nextValue) {
                return;
              }
              setFilterBy(nextValue as typeof filterBy);
            }}
            variant="outline"
            size="sm"
            spacing={1}
            className="flex w-full flex-wrap rounded-xl bg-muted/50 p-1"
          >
            {filterOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className={cn(
                  'grow border-0 px-2.5 sm:grow-0',
                  'aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm',
                )}
              >
                <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {isDateRangeFilter ? (
            <DatePickerRange
              value={dateRange}
              onChange={setDateRange}
              locale={locale}
              placeholder={intl.formatMessage({
                id: 'wallet.actions.dateRangePlaceholder',
                defaultMessage: 'Choose dates',
              })}
            />
          ) : null}

          {filterPreview ? <p className="text-sm text-muted-foreground">{filterPreview}</p> : null}
        </div>

        {isPending && (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            <FormattedMessage id="wallet.settings.activities.loadFailed" defaultMessage="Failed to load activities." />
          </p>
        )}

        {!isPending && !isError && data.items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <FormattedMessage id="wallet.settings.activities.title" defaultMessage="Activities" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{resultLabel}</span>
            </div>
            <div className="space-y-4">
              {data.items.map((item) => (
                <WalletSettingsActivity key={item.id} item={item} currency={currency} locale={locale} />
              ))}
            </div>
          </div>
        )}

        {!isPending && !isError && data.items.length === 0 && <WalletEmpty variant="activity" />}

        {showPagination && (
          <AppPagination
            page={page}
            totalPages={totalPages}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            pageItems={pageItems}
            goToPage={goToPage}
            goToPreviousPage={() => goToPage(page - 1)}
            goToNextPage={() => goToPage(page + 1)}
          />
        )}
      </div>
    </div>
  );
}

export { WalletSettingsActivities };
