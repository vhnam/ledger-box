import { useMemo, useState } from 'react';

import { Badge } from '@vhnam/ui/components/badge';
import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatCurrency } from '@vhnam/utils/currency';
import { formatDateTime } from '@vhnam/utils/date';

import { AppPagination } from '#/components/app-pagination';
import { getPageItems } from '#/lib/pagination';
import type { ActivityLogItemDto } from '#/queries/activity/activity.dto';
import { useWalletActivity } from '#/queries/activity/activity.queries';

type WalletSettingsActivityProps = {
  walletId: string;
};

function actionLabel(item: ActivityLogItemDto): string {
  const entity = item.entityType.replaceAll('_', ' ');

  if (item.action === 'create') {
    return `Created ${entity}`;
  }

  if (item.action === 'update') {
    return `Updated ${entity}`;
  }

  if (item.action === 'delete') {
    return `Deleted ${entity}`;
  }

  if (item.action === 'transfer') {
    return 'Transfer';
  }

  if (item.action === 'invite') {
    return 'Invited member';
  }

  if (item.action === 'role_change') {
    return 'Changed member role';
  }

  if (item.action === 'revoke') {
    return 'Revoked statement share';
  }

  return 'Renamed wallet';
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

function ActivityRow({ item }: { item: ActivityLogItemDto }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{actionLabel(item)}</p>
            {item.affectsActiveStatementShare ? <Badge variant="secondary">Affects shared statement</Badge> : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">{entitySummary(item)}</p>
          <p className="text-xs text-muted-foreground">
            {item.actorEmail} · {formatDateTime(item.createdAt)}
            {item.walletAmountDelta != null && item.walletAmountDelta !== 0
              ? ` · ${formatCurrency(item.walletAmountDelta)}`
              : null}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
          <Icon name={expanded ? 'CaretUpIcon' : 'CaretDownIcon'} />
          {expanded ? 'Hide' : 'Details'}
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

function WalletSettingsActivity({ walletId }: WalletSettingsActivityProps) {
  const [page, setPage] = useState(1);
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Audit trail of changes to this wallet. Entries are never edited or deleted.
        </p>
      </div>

      {isPending ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load activity.</p>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <>
          <ul className="divide-y">
            {data.items.map((item) => (
              <ActivityRow key={item.id} item={item} />
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
        </>
      )}
    </div>
  );
}

export { WalletSettingsActivity };
