import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency, formatSignedCurrency } from '@vhnam/utils/currency';
import { formatInTimeZone, LOCALE_DATE_TIME_PATTERNS } from '@vhnam/utils/date';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { StatementAttachmentDto, StatementSnapshotDto } from '#/queries/statement-shares/statement-share.dto';

import { AttachmentPreview } from '#/components/attachment-preview';

import { StatementRowAttachments } from './statement-row-attachments';
import { formatSnapshotDate } from './statement-snapshot-view.utils';

type StatementSnapshotViewProps = {
  snapshot: StatementSnapshotDto;
};

type RowAttachmentPreviewState = {
  attachments: StatementAttachmentDto[];
  attachmentId: string;
};

function StatementSnapshotView({ snapshot }: StatementSnapshotViewProps) {
  const intl = useIntl();
  const locale = useAppLocale();
  const [preview, setPreview] = useState<RowAttachmentPreviewState | null>(null);
  const allTimeLabel = intl.formatMessage({ id: 'statement.snapshot.allTime', defaultMessage: 'All time' });

  function handlePreviewAttachment(attachments: StatementAttachmentDto[], attachmentId: string) {
    setPreview({ attachments, attachmentId });
  }

  const periodFromLabel = formatSnapshotDate(snapshot.periodFrom, snapshot.timezone, locale);
  const periodToLabel = formatSnapshotDate(snapshot.periodTo, snapshot.timezone, locale);
  const periodLabel = periodFromLabel && periodToLabel ? `${periodFromLabel} - ${periodToLabel}` : allTimeLabel;

  const generatedDate = formatInTimeZone(
    snapshot.snapshotAt,
    snapshot.timezone,
    LOCALE_DATE_TIME_PATTERNS[locale].Numeric,
    locale,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{periodLabel}</p>
        <p className="text-xs text-muted-foreground">
          <FormattedMessage
            id="statement.snapshot.generated"
            defaultMessage="Generated {date}"
            values={{ date: generatedDate }}
          />{' '}
          <em className="text-tiny">({snapshot.timezone})</em>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">
            <FormattedMessage id="statement.snapshot.opening" defaultMessage="Opening" />
          </p>
          <p className="font-mono text-sm font-medium">
            {formatCurrency(snapshot.openingBalance, { currency: snapshot.currency, locale })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            <FormattedMessage id="statement.snapshot.closing" defaultMessage="Closing" />
          </p>
          <p className="font-mono text-sm font-medium">
            {formatCurrency(snapshot.closingBalance, { currency: snapshot.currency, locale })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            <FormattedMessage id="statement.snapshot.totalIn" defaultMessage="Total in" />
          </p>
          <p className="font-mono text-sm font-medium text-emerald-600">
            {formatCurrency(snapshot.totalIn, { currency: snapshot.currency, locale })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            <FormattedMessage id="statement.snapshot.totalOut" defaultMessage="Total out" />
          </p>
          <p className="font-mono text-sm font-medium text-rose-600">
            {formatCurrency(snapshot.totalOut, { currency: snapshot.currency, locale })}
          </p>
        </div>
      </div>

      <div className="divide-y rounded-xl border">
        {snapshot.rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            <FormattedMessage id="statement.snapshot.empty" defaultMessage="No transactions in this period." />
          </p>
        ) : (
          snapshot.rows.map((row, index) => (
            <div key={index} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSnapshotDate(row.occurredAt, snapshot.timezone, locale) ?? allTimeLabel}
                </p>
                <StatementRowAttachments attachments={row.attachments} onPreview={handlePreviewAttachment} />
              </div>
              <div className="shrink-0 text-right">
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

      <AttachmentPreview
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
          }
        }}
        attachments={(preview?.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          previewUrl: attachment.url,
        }))}
        initialAttachmentId={preview?.attachmentId}
      />
    </div>
  );
}

export { StatementSnapshotView };
