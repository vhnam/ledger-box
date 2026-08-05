import { getCurrencyFractionDigits } from '@vhnam/utils/currency';

import type { StatementSnapshot } from '#/lib/statement';

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

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoValue));

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function formatPeriodLabel(snapshot: StatementSnapshot): string {
  if (!snapshot.periodFrom || !snapshot.periodTo) {
    return 'All time';
  }

  return `${formatCsvDate(snapshot.periodFrom, snapshot.timezone)} to ${formatCsvDate(snapshot.periodTo, snapshot.timezone)}`;
}

export function encodeStatementCsv(snapshot: StatementSnapshot, displayTitle: string | null): string {
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
  lines.push('Date,Description,Type,Amount,Running balance');

  for (const row of snapshot.rows) {
    const signedAmount = row.type === 'income' ? row.amount : -row.amount;

    lines.push(
      [
        formatCsvDate(row.occurredAt, snapshot.timezone),
        escapeCsvField(row.description),
        row.type,
        formatCsvAmount(signedAmount, snapshot.currency),
        formatCsvAmount(row.runningBalance, snapshot.currency),
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
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(isoValue));

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${lookup.year}${lookup.month}${lookup.day}${lookup.hour}${lookup.minute}`;
}

export function buildStatementCsvFilename(snapshot: StatementSnapshot, walletName: string): string {
  const period =
    snapshot.periodFrom && snapshot.periodTo
      ? `${formatCsvDate(snapshot.periodFrom, snapshot.timezone)}_${formatCsvDate(snapshot.periodTo, snapshot.timezone)}`
      : 'all-time';
  const generatedAt = formatFilenameTimestamp(snapshot.snapshotAt, snapshot.timezone);

  return `statement-${sanitizeFilenameSegment(walletName)}-${period}-${generatedAt}.csv`;
}
