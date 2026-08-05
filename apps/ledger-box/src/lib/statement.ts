import type { Kysely } from 'kysely';

import type { Database } from '#/lib/db/schema';
import type { PeriodBounds } from '#/lib/period-bounds';

type StatementRow = {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  occurredAt: string;
  runningBalance: number;
};

type StatementSnapshot = {
  timezone: string;
  currency: string;
  periodFrom: string | null;
  periodTo: string | null;
  snapshotAt: string;
  openingBalance: number;
  closingBalance: number;
  totalIn: number;
  totalOut: number;
  rows: StatementRow[];
};

function getContribution(type: 'income' | 'expense', amount: number): number {
  return type === 'income' ? amount : -amount;
}

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
 */
export async function buildStatement(
  db: Kysely<Database>,
  walletId: string,
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
    .select(['type', 'amount', 'description', 'occurredAt'])
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .orderBy('occurredAt', 'asc')
    .orderBy('id', 'asc');

  if (bounds) {
    periodQuery = periodQuery.where('occurredAt', '>=', bounds.start).where('occurredAt', '<', bounds.endExclusive);
  }

  const periodTransactions = await periodQuery.execute();

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

    return {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      occurredAt: new Date(transaction.occurredAt).toISOString(),
      runningBalance,
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

export type { StatementRow, StatementSnapshot };
