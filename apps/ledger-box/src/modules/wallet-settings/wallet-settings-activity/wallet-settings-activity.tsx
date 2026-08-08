import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

import { Badge } from '@vhnam/ui/components/badge';
import { Button } from '@vhnam/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatCurrency } from '@vhnam/utils/currency';
import { formatDateTime } from '@vhnam/utils/date';
import type { SupportedLocale } from '@vhnam/utils/locale';

import { getPageItems } from '#/utils/pagination';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { ActivityLogItemDto } from '#/queries/activity/activity.dto';
import { useWalletActivity } from '#/queries/activity/activity.queries';

import { AppPagination } from '#/components/app-pagination';

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
    <li className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{actionLabel(intl, item)}</p>
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
          <p className="text-xs text-muted-foreground">
            {item.actorEmail} · {formatDateTime(item.createdAt, undefined, locale)}
            {item.walletAmountDelta != null && item.walletAmountDelta !== 0
              ? ` · ${formatCurrency(item.walletAmountDelta, { currency, locale })}`
              : null}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
          <Icon name={expanded ? 'CaretUpIcon' : 'CaretDownIcon'} />
          {expanded ? (
            <FormattedMessage id="wallet.settings.activity.hide" defaultMessage="Hide" />
          ) : (
            <FormattedMessage id="wallet.settings.activity.details" defaultMessage="Details" />
          )}
        </Button>
      </div>
      {expanded ? (
        <div className="rounded-md bg-muted/40 p-3 text-xs">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify({ before: item.before, after: item.after }, null, 2)}
          </pre>
        </div>
      ) : null}
    </li>
  );
}

function WalletSettingsActivity({ walletId, currency }: WalletSettingsActivityProps) {
  const [page, setPage] = useState(1);
  const locale = useAppLocale();
  const { data, isPending, isError } = useWalletActivity(walletId, page, true);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="font-heading text-2xl font-semibold">
          <FormattedMessage id="wallet.settings.activity.title" defaultMessage="Activity" />
        </h1>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="wallet.settings.activity.description"
            defaultMessage="Audit trail of changes to this wallet. Entries are never edited or deleted."
          />
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <FormattedMessage id="wallet.settings.activity.title" defaultMessage="Activity" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              <FormattedMessage id="wallet.settings.activity.loadFailed" defaultMessage="Failed to load activity." />
            </p>
          ) : data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <FormattedMessage id="wallet.settings.activity.empty" defaultMessage="No activity recorded yet." />
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <ul className="divide-y">
                {data.items.map((item) => (
                  <ActivityRow key={item.id} item={item} currency={currency} locale={locale} />
                ))}
              </ul>
              {totalPages > 1 ? (
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
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { WalletSettingsActivity };
