import type { Kysely } from 'kysely';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { Database } from '#/lib/db/schema';

import { computeWalletSummary } from './wallet-summary';

type FakeRow = Record<string, unknown>;

function createFakeDb(rows: FakeRow[]) {
  const builder = {
    select: () => builder,
    where: () => builder,
    groupBy: () => builder,
    execute: () => Promise.resolve(rows),
  };

  return {
    selectFrom: vi.fn(() => builder),
  } as unknown as Kysely<Database>;
}

describe('computeWalletSummary', () => {
  it('aggregates income and expense totals into a net balance', async () => {
    const db = createFakeDb([
      { type: 'income', total: '500' },
      { type: 'expense', total: '120' },
    ]);

    const totals = await computeWalletSummary(db, 'w1', null);

    expect(totals).toEqual({ income: 500, expenses: 120, netBalance: 380 });
  });

  it('defaults missing income or expense rows to zero', async () => {
    const db = createFakeDb([{ type: 'income', total: '75' }]);

    const totals = await computeWalletSummary(db, 'w1', null);

    expect(totals).toEqual({ income: 75, expenses: 0, netBalance: 75 });
  });

  it('returns zeroed totals when there are no transactions', async () => {
    const db = createFakeDb([]);

    const totals = await computeWalletSummary(db, 'w1', null);

    expect(totals).toEqual({ income: 0, expenses: 0, netBalance: 0 });
  });
});
