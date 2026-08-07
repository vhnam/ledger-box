import type { Kysely } from 'kysely';

import type { PeriodBounds } from '#/utils/wallet/period-bounds';

import type { Database } from '#/lib/db/schema';

type WalletSummaryTotals = {
  income: number;
  expenses: number;
  netBalance: number;
};

/**
 * Aggregates income/expense totals for a wallet and period directly in the database, rather
 * than reducing over a paginated page of transactions (the previous `useWalletSummary`
 * implementation truncated totals for periods with more than 100 rows).
 */
export async function computeWalletSummary(
  db: Kysely<Database>,
  walletId: string,
  bounds: PeriodBounds | null,
): Promise<WalletSummaryTotals> {
  let query = db
    .selectFrom('transaction')
    .select(['type'])
    .select((eb) => eb.fn.sum<string>('amount').as('total'))
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .groupBy('type');

  if (bounds) {
    query = query.where('occurredAt', '>=', bounds.start).where('occurredAt', '<', bounds.endExclusive);
  }

  const rows = await query.execute();

  let income = 0;
  let expenses = 0;

  for (const row of rows) {
    const total = Number(row.total ?? 0);

    if (row.type === 'income') {
      income = total;
    } else {
      expenses = total;
    }
  }

  return { income, expenses, netBalance: income - expenses };
}

export type { WalletSummaryTotals };
