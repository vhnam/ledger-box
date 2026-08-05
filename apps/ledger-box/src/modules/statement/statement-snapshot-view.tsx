import { useMemo } from 'react';

import { formatCurrency, formatSignedCurrency } from '@vhnam/utils/currency';

import { resolveClientLocale } from '#/lib/client-locale';
import type { StatementSnapshotDto } from '#/queries/statement-shares/statement-share.dto';

type StatementSnapshotViewProps = {
  snapshot: StatementSnapshotDto;
};

function formatSnapshotDate(value: string | null, timezone: string, locale: string): string {
  if (!value) {
    return 'All time';
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: timezone }).format(new Date(value));
}

function StatementSnapshotView({ snapshot }: StatementSnapshotViewProps) {
  const locale = useMemo(() => resolveClientLocale(), []);
  const periodLabel =
    snapshot.periodFrom && snapshot.periodTo
      ? `${formatSnapshotDate(snapshot.periodFrom, snapshot.timezone, locale)} – ${formatSnapshotDate(snapshot.periodTo, snapshot.timezone, locale)}`
      : 'All time';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {periodLabel} ({snapshot.timezone})
        </p>
        <p className="text-xs text-muted-foreground">
          Generated{' '}
          {new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: snapshot.timezone,
          }).format(new Date(snapshot.snapshotAt))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Opening</p>
          <p className="font-mono text-sm font-medium">
            {formatCurrency(snapshot.openingBalance, { currency: snapshot.currency, locale })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Closing</p>
          <p className="font-mono text-sm font-medium">
            {formatCurrency(snapshot.closingBalance, { currency: snapshot.currency, locale })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total in</p>
          <p className="font-mono text-sm font-medium text-emerald-600">
            {formatCurrency(snapshot.totalIn, { currency: snapshot.currency, locale })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total out</p>
          <p className="font-mono text-sm font-medium text-rose-600">
            {formatCurrency(snapshot.totalOut, { currency: snapshot.currency, locale })}
          </p>
        </div>
      </div>

      <div className="divide-y rounded-xl border">
        {snapshot.rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No transactions in this period.</p>
        ) : (
          snapshot.rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSnapshotDate(row.occurredAt, snapshot.timezone, locale)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={
                    row.type === 'income' ? 'font-mono text-sm text-emerald-600' : 'font-mono text-sm text-rose-600'
                  }
                >
                  {formatSignedCurrency(row.amount, row.type, { currency: snapshot.currency, locale })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(row.runningBalance, { currency: snapshot.currency, locale })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { StatementSnapshotView };
