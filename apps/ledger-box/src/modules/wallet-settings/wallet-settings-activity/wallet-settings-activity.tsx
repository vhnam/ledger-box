import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';
import { Icon } from '@vhnam/ui/components/icon';
import { Badge } from '@vhnam/ui/components/ui/badge';
import { Button } from '@vhnam/ui/components/ui/button';
import { Skeleton } from '@vhnam/ui/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@vhnam/ui/components/ui/toggle-group';
import { cn } from '@vhnam/ui/lib/cn';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { formatDateTime } from '@vhnam/utils/date';
import type { SupportedLocale } from '@vhnam/utils/locale';

import { getPageItems } from '#/utils/pagination';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { ActivityLogItemDto } from '#/queries/activity/activity.dto';
import { useWalletActivity } from '#/queries/activity/activity.queries';

import { AppPagination } from '#/components/app-pagination';
import { WalletEmpty } from '#/components/wallet-empty';

import { useWalletSettingsActivityFilters } from './wallet-settings-activity.actions';

type WalletSettingsActivityProps = {
  walletId: string;
  currency: string;
};

const ENTITY_DEFAULTS: Record<string, string> = {
  transaction: 'transaction',
  wallet: 'wallet',
  wallet_member: 'wallet member',
  statement_share: 'statement share',
  transfer: 'transfer',
};

const ACTION_DEFAULTS: Record<string, string> = {
  create: 'Created {entity}',
  update: 'Updated {entity}',
  delete: 'Deleted {entity}',
  transfer: 'Transfer',
  invite: 'Invited member',
  role_change: 'Changed member role',
  revoke: 'Revoked statement share',
  rename: 'Renamed wallet',
  invite_resend: 'Resent invite',
  invite_email_failed: 'Invite email failed',
};

function actionLabel(intl: IntlShape, item: ActivityLogItemDto): string {
  const entity = intl.formatMessage({
    id: `activity.entity.${item.entityType}`,
    defaultMessage: ENTITY_DEFAULTS[item.entityType] ?? item.entityType,
  });

  if (item.action === 'create' || item.action === 'update' || item.action === 'delete') {
    return intl.formatMessage(
      {
        id: `activity.action.${item.action}`,
        defaultMessage: ACTION_DEFAULTS[item.action],
      },
      { entity },
    );
  }

  return intl.formatMessage({
    id: `activity.action.${item.action}`,
    defaultMessage: ACTION_DEFAULTS[item.action] ?? item.action,
  });
}

function entitySummary(item: ActivityLogItemDto): string {
  const after = item.after;
  const before = item.before;

  if (item.entityType === 'transaction' || item.entityType === 'transfer') {
    const snapshot = (after ?? before) as { description?: string; amount?: number } | null;
    if (snapshot?.description) {
      return snapshot.description;
    }
  }

  if (item.entityType === 'wallet') {
    const name = (after as { name?: string } | null)?.name ?? (before as { name?: string } | null)?.name;
    if (name) {
      return name;
    }
  }

  if (item.entityType === 'wallet_member') {
    const email = (after as { email?: string } | null)?.email ?? (before as { email?: string } | null)?.email;
    if (email) {
      return email;
    }
  }

  return item.entityId;
}

function ActivityRow({
  item,
  currency,
  locale,
}: {
  item: ActivityLogItemDto;
  currency: string;
  locale: SupportedLocale;
}) {
  const intl = useIntl();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="gap-4 rounded-lg border bg-card px-4 py-3 transition-all duration-100">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{actionLabel(intl, item)}</p>
            {item.affectsActiveStatementShare ? (
              <Badge variant="secondary">
                <FormattedMessage
                  id="wallet.settings.activity.affectsShare"
                  defaultMessage="Affects shared statement"
                />
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">{entitySummary(item)}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {formatDateTime(item.createdAt, undefined, locale)} · {item.actorEmail}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {item.walletAmountDelta != null && item.walletAmountDelta !== 0 ? (
            <p
              className={cn(
                'font-mono text-sm font-medium',
                item.walletAmountDelta > 0 ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {formatSignedCurrency(
                Math.abs(item.walletAmountDelta),
                item.walletAmountDelta > 0 ? 'income' : 'expense',
                {
                  currency,
                  locale,
                },
              )}
            </p>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            <Icon name={expanded ? 'CaretUpIcon' : 'CaretDownIcon'} />
            {expanded ? (
              <FormattedMessage id="wallet.settings.activity.hide" defaultMessage="Hide" />
            ) : (
              <FormattedMessage id="wallet.settings.activity.details" defaultMessage="Details" />
            )}
          </Button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify({ before: item.before, after: item.after }, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function WalletSettingsActivity({ walletId, currency }: WalletSettingsActivityProps) {
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
  } = useWalletSettingsActivityFilters();
  const { data, isPending, isError } = useWalletActivity(walletId, activityQuery, true);
  const totalResults = data?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const showPagination = totalPages > 1;
  const resultLabel =
    totalResults === 1
      ? intl.formatMessage({ id: 'wallet.settings.activity.resultOne', defaultMessage: '1 result' })
      : intl.formatMessage(
          { id: 'wallet.settings.activity.resultOther', defaultMessage: '{count} results' },
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
          <FormattedMessage id="wallet.settings.activity.title" defaultMessage="Activity" />
        </h1>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="wallet.settings.activity.description"
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
            <FormattedMessage id="wallet.settings.activity.loadFailed" defaultMessage="Failed to load activity." />
          </p>
        )}

        {!isPending && !isError && data.items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <FormattedMessage id="wallet.settings.activity.title" defaultMessage="Activity" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{resultLabel}</span>
            </div>
            <div className="space-y-4">
              {data.items.map((item) => (
                <ActivityRow key={item.id} item={item} currency={currency} locale={locale} />
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

export { WalletSettingsActivity };
