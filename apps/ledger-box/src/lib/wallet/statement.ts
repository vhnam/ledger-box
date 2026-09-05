import type { Kysely } from 'kysely';

import type { PeriodBounds } from '#/utils/wallet/period-bounds';

import type { Database } from '#/lib/db/schema';
import { getAttachmentViewUrl, listTransactionAttachments } from '#/lib/storage/r2';

/**
 * The object *key* is what's frozen into the snapshot, never a URL — a public bucket URL
 * would be permanent, and a presigned one would expire long before a share link does. A
 * fresh, short-lived, view-only URL is signed on demand by `resolveAttachmentViewUrl`
 * whenever the snapshot is actually rendered (viewed, exported to PDF/CSV).
 */
type StatementAttachment = {
  id: string;
  key: string;
  fileName: string;
  contentType: string;
  size: number;
};

type ResolvedStatementAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
};

type StatementRow<TAttachment = StatementAttachment> = {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  occurredAt: string;
  runningBalance: number;
  attachments: TAttachment[];
};

type StatementSnapshot<TAttachment = StatementAttachment> = {
  timezone: string;
  currency: string;
  periodFrom: string | null;
  periodTo: string | null;
  snapshotAt: string;
  openingBalance: number;
  closingBalance: number;
  totalIn: number;
  totalOut: number;
  rows: StatementRow<TAttachment>[];
};

/** `StatementSnapshot` after each attachment's stored `key` is signed into a live `url`. */
type ResolvedStatementSnapshot = StatementSnapshot<ResolvedStatementAttachment>;

function getContribution(type: 'income' | 'expense', amount: number): number {
  return type === 'income' ? amount : -amount;
}

/** TTL for attachment view URLs signed for an on-screen render (statement page, preview). */
export const ATTACHMENT_VIEW_URL_TTL_SECONDS = 15 * 60;

/**
 * TTL for attachment view URLs signed into a downloaded PDF/CSV — longer than the on-screen
 * TTL since the file may sit unopened for a while, but still bounded: the link must not
 * outlive its usefulness the way the old permanent public-bucket URL did.
 */
export const ATTACHMENT_EXPORT_URL_TTL_SECONDS = 24 * 60 * 60;

/**
 * Builds a full-period statement (opening/closing balance, running balance per row, totals)
 * for `walletId`. Never paginates: a statement must reflect every non-deleted transaction in
 * the period, unlike the transaction list endpoint.
 *
 * `bounds === null` means all-time: opening balance is 0 and every non-deleted transaction is
 * a period row. For that case, the computed closing balance is reconciled against
 * `wallet.amount` and any mismatch is logged (not thrown) — a diverging total elsewhere in the
 * app (a balance mutation that bypassed the normal transaction flow) should surface as a
 * signal for investigation, not block statement generation or share-link creation.
 *
 * Each row's attachments are resolved from object storage and frozen into the snapshot at
 * build time, same as the amounts — a share link must keep showing what was attached when it
 * was created, even if the transaction's attachments change later.
 */
export async function buildStatement(
  db: Kysely<Database>,
  walletId: string,
  tenantId: string,
  bounds: PeriodBounds | null,
  timezone: string,
): Promise<StatementSnapshot> {
  const wallet = await db
    .selectFrom('wallet')
    .select(['amount', 'currency', 'deletedAt'])
    .where('id', '=', walletId)
    .executeTakeFirst();

  if (!wallet || wallet.deletedAt) {
    throw new Error('Wallet not found');
  }

  let openingBalance = 0;

  if (bounds) {
    const openingRows = await db
      .selectFrom('transaction')
      .select(['type', 'amount'])
      .where('walletId', '=', walletId)
      .where('deletedAt', 'is', null)
      .where('occurredAt', '<', bounds.start)
      .execute();

    openingBalance = openingRows.reduce((total, row) => total + getContribution(row.type, row.amount), 0);
  }

  let periodQuery = db
    .selectFrom('transaction')
    .select(['id', 'type', 'amount', 'description', 'occurredAt'])
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .orderBy('occurredAt', 'asc')
    .orderBy('id', 'asc');

  if (bounds) {
    periodQuery = periodQuery.where('occurredAt', '>=', bounds.start).where('occurredAt', '<', bounds.endExclusive);
  }

  const periodTransactions = await periodQuery.execute();

  const attachmentsByTransactionId = new Map(
    await Promise.all(
      periodTransactions.map(
        async (transaction) => [transaction.id, await listTransactionAttachments(tenantId, transaction.id)] as const,
      ),
    ),
  );

  let runningBalance = openingBalance;
  let totalIn = 0;
  let totalOut = 0;

  const rows: StatementRow[] = periodTransactions.map((transaction) => {
    if (transaction.type === 'income') {
      totalIn += transaction.amount;
    } else {
      totalOut += transaction.amount;
    }

    runningBalance += getContribution(transaction.type, transaction.amount);

    const attachments = (attachmentsByTransactionId.get(transaction.id) ?? []).map((attachment) => ({
      id: attachment.id,
      key: attachment.key,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
    }));

    return {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      occurredAt: new Date(transaction.occurredAt).toISOString(),
      runningBalance,
      attachments,
    };
  });

  const closingBalance = openingBalance + totalIn - totalOut;

  if (bounds === null && closingBalance !== wallet.amount) {
    console.warn('[statement] all-time closing balance does not match wallet.amount', {
      walletId,
      computedClosingBalance: closingBalance,
      walletAmount: wallet.amount,
    });
  }

  return {
    timezone,
    currency: wallet.currency,
    periodFrom: bounds ? bounds.start.toISOString() : null,
    periodTo: bounds ? bounds.endExclusive.toISOString() : null,
    snapshotAt: new Date().toISOString(),
    openingBalance,
    closingBalance,
    totalIn,
    totalOut,
    rows,
  };
}

/**
 * Frozen `snapshotJson` predates this file's current `StatementAttachment` shape in two ways
 * still live in the database: rows with no `attachments` key at all (from before attachments
 * were captured), and rows whose attachments carry a since-removed `url` instead of `key`
 * (from the brief window between capturing attachments and switching to signed view URLs).
 * This is what a persisted row's attachment actually looks like on disk, not what today's
 * `StatementAttachment` type says it should.
 */
type StoredStatementAttachment = {
  id: string;
  key?: string;
  url?: string;
  fileName: string;
  contentType: string;
  size: number;
};

/**
 * Signs a fresh, view-only, `expiresInSeconds`-lived URL for every attachment in `snapshot` —
 * called at the moment a statement is actually rendered (a public/owner view, or a PDF/CSV
 * export), never baked into the stored snapshot itself. Attachment-less rows, and attachments
 * from an older snapshot shape with neither `key` nor `url`, are dropped rather than thrown on.
 */
export async function resolveAttachmentViewUrls(
  snapshot: StatementSnapshot,
  expiresInSeconds: number,
): Promise<ResolvedStatementSnapshot> {
  const rows = await Promise.all(
    snapshot.rows.map(async (row): Promise<StatementRow<ResolvedStatementAttachment>> => {
      const storedAttachments = (row.attachments ?? []) as unknown as StoredStatementAttachment[];

      const resolved = await Promise.all(
        storedAttachments.map(async (attachment): Promise<ResolvedStatementAttachment | null> => {
          const url = attachment.key
            ? await getAttachmentViewUrl({
                key: attachment.key,
                fileName: attachment.fileName,
                contentType: attachment.contentType,
                expiresInSeconds,
              })
            : attachment.url;

          if (!url) {
            return null;
          }

          return {
            id: attachment.id,
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            size: attachment.size,
            url,
          };
        }),
      );

      return { ...row, attachments: resolved.filter((attachment) => attachment !== null) };
    }),
  );

  return { ...snapshot, rows };
}

export type { ResolvedStatementAttachment, StatementAttachment, StatementRow, StatementSnapshot };
