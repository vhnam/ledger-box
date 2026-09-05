import { getCurrencyFractionDigits } from '@vhnam/utils/currency';
import { formatInTimeZone } from '@vhnam/utils/date';

import type { ResolvedStatementAttachment, StatementSnapshot } from '#/lib/wallet/statement';

type ResolvedStatementSnapshot = StatementSnapshot<ResolvedStatementAttachment>;

const CSV_BOM = '﻿';
const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@'];

function escapeCsvField(value: string): string {
  const needsFormulaGuard = FORMULA_TRIGGER_CHARS.some((char) => value.startsWith(char));
  const guarded = needsFormulaGuard ? `'${value}` : value;

  if (/[",\r\n]/.test(guarded)) {
    return `"${guarded.replaceAll('"', '""')}"`;
  }

  return guarded;
}

function formatCsvAmount(amount: number, currency: string): string {
  return amount.toFixed(getCurrencyFractionDigits(currency));
}

function formatCsvDate(isoValue: string | null, timezone: string): string {
  if (!isoValue) {
    return '';
  }

  return formatInTimeZone(isoValue, timezone, 'yyyy-MM-dd');
}

function formatAttachmentsCell(attachments: ResolvedStatementAttachment[] | undefined): string {
  return (attachments ?? []).map((attachment) => `${attachment.fileName}: ${attachment.url}`).join('; ');
}

function formatPeriodLabel(snapshot: Pick<StatementSnapshot, 'periodFrom' | 'periodTo' | 'timezone'>): string {
  if (!snapshot.periodFrom || !snapshot.periodTo) {
    return 'All time';
  }

  return `${formatCsvDate(snapshot.periodFrom, snapshot.timezone)} to ${formatCsvDate(snapshot.periodTo, snapshot.timezone)}`;
}

type EncodeStatementCsvOptions = {
  /**
   * Reserved for the viewer's detected locale. Not currently applied to numeric/date
   * cells: those are deliberately locale-*independent* (`en-CA` for ISO-sortable dates,
   * unlocalized `toFixed` for amounts) so the CSV stays machine-parseable by spreadsheet
   * tools regardless of viewer — a locale-grouped number (e.g. `fr-FR`'s space/comma
   * separators) would corrupt the unescaped, comma-delimited numeric/date columns.
   */
  locale?: string;
};

export function encodeStatementCsv(
  snapshot: ResolvedStatementSnapshot,
  displayTitle: string | null,
  // Accepted for API forward-compatibility; see `EncodeStatementCsvOptions` for why it's unused today.
  _options: EncodeStatementCsvOptions = {},
): string {
  const lines: string[] = [];

  lines.push(`Statement,${escapeCsvField(displayTitle ?? 'Account statement')}`);
  lines.push(`Period,${escapeCsvField(formatPeriodLabel(snapshot))}`);
  lines.push(`Timezone,${escapeCsvField(snapshot.timezone)}`);
  lines.push(`Currency,${escapeCsvField(snapshot.currency)}`);
  lines.push(`Generated at,${escapeCsvField(formatCsvDate(snapshot.snapshotAt, snapshot.timezone))}`);
  lines.push(`Opening balance,${formatCsvAmount(snapshot.openingBalance, snapshot.currency)}`);
  lines.push(`Closing balance,${formatCsvAmount(snapshot.closingBalance, snapshot.currency)}`);
  lines.push(`Total in,${formatCsvAmount(snapshot.totalIn, snapshot.currency)}`);
  lines.push(`Total out,${formatCsvAmount(snapshot.totalOut, snapshot.currency)}`);
  lines.push('');
  lines.push('Date,Description,Type,Amount,Running balance,Attachments');

  for (const row of snapshot.rows) {
    const signedAmount = row.type === 'income' ? row.amount : -row.amount;

    lines.push(
      [
        formatCsvDate(row.occurredAt, snapshot.timezone),
        escapeCsvField(row.description),
        row.type,
        formatCsvAmount(signedAmount, snapshot.currency),
        formatCsvAmount(row.runningBalance, snapshot.currency),
        escapeCsvField(formatAttachmentsCell(row.attachments)),
      ].join(','),
    );
  }

  return CSV_BOM + lines.join('\r\n');
}

function sanitizeFilenameSegment(value: string): string {
  const sanitized = value
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  return sanitized.length > 0 ? sanitized : 'statement';
}

function formatFilenameTimestamp(isoValue: string, timezone: string): string {
  return formatInTimeZone(isoValue, timezone, 'yyyyMMddHHmm');
}

export type StatementExportFormat = 'csv' | 'pdf';

type StatementFilenameFields = Pick<StatementSnapshot, 'periodFrom' | 'periodTo' | 'timezone' | 'snapshotAt'>;

export function buildStatementExportFilename(
  snapshot: StatementFilenameFields,
  walletName: string,
  format: StatementExportFormat,
): string {
  const period =
    snapshot.periodFrom && snapshot.periodTo
      ? `${formatCsvDate(snapshot.periodFrom, snapshot.timezone)}_${formatCsvDate(snapshot.periodTo, snapshot.timezone)}`
      : 'all-time';
  const generatedAt = formatFilenameTimestamp(snapshot.snapshotAt, snapshot.timezone);

  return `statement-${sanitizeFilenameSegment(walletName)}-${period}-${generatedAt}.${format}`;
}

export function buildStatementCsvFilename(snapshot: StatementFilenameFields, walletName: string): string {
  return buildStatementExportFilename(snapshot, walletName, 'csv');
}

export { encodeStatementPdf } from './statement-export-pdf';
