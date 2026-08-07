import type { Kysely } from 'kysely';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { Database } from '#/lib/db/schema';

import { buildStatement } from './statement';

type FakeRow = Record<string, unknown>;

/**
 * Minimal stand-in for a Kysely query builder: every chained method returns itself, and
 * `execute`/`executeTakeFirst` resolve from queues keyed by the table passed to `selectFrom`.
 */
function createFakeDb(config: { wallet: FakeRow | undefined; transactionResults: FakeRow[][] }) {
  const transactionQueue = [...config.transactionResults];

  const builder = {
    select: () => builder,
    where: () => builder,
    orderBy: () => builder,
    executeTakeFirst: () => Promise.resolve(config.wallet),
    execute: () => Promise.resolve(transactionQueue.shift() ?? []),
  };

  return {
    selectFrom: vi.fn(() => builder),
  } as unknown as Kysely<Database>;
}

describe('buildStatement', () => {
  it('throws when the wallet does not exist', async () => {
    const db = createFakeDb({ wallet: undefined, transactionResults: [] });

    await expect(buildStatement(db, 'w1', null, 'UTC')).rejects.toThrow('Wallet not found');
  });

  it('throws when the wallet is soft-deleted', async () => {
    const db = createFakeDb({
      wallet: { amount: 100, currency: 'USD', deletedAt: new Date() },
      transactionResults: [],
    });

    await expect(buildStatement(db, 'w1', null, 'UTC')).rejects.toThrow('Wallet not found');
  });

  it('computes running balances and totals for an all-time statement', async () => {
    const db = createFakeDb({
      wallet: { amount: 150, currency: 'USD', deletedAt: null },
      transactionResults: [
        [
          { type: 'income', amount: 200, description: 'Salary', occurredAt: '2026-08-01T00:00:00.000Z' },
          { type: 'expense', amount: 50, description: 'Groceries', occurredAt: '2026-08-02T00:00:00.000Z' },
        ],
      ],
    });

    const snapshot = await buildStatement(db, 'w1', null, 'UTC');

    expect(snapshot.openingBalance).toBe(0);
    expect(snapshot.totalIn).toBe(200);
    expect(snapshot.totalOut).toBe(50);
    expect(snapshot.closingBalance).toBe(150);
    expect(snapshot.rows.map((row) => row.runningBalance)).toEqual([200, 150]);
    expect(snapshot.periodFrom).toBeNull();
  });

  it('uses the opening-balance query result when bounds are given', async () => {
    const db = createFakeDb({
      wallet: { amount: 300, currency: 'USD', deletedAt: null },
      transactionResults: [
        [{ type: 'income', amount: 100 }],
        [{ type: 'income', amount: 250, description: 'Bonus', occurredAt: '2026-08-05T00:00:00.000Z' }],
      ],
    });

    const bounds = { start: new Date('2026-08-01T00:00:00.000Z'), endExclusive: new Date('2026-09-01T00:00:00.000Z') };
    const snapshot = await buildStatement(db, 'w1', bounds, 'UTC');

    expect(snapshot.openingBalance).toBe(100);
    expect(snapshot.closingBalance).toBe(350);
    expect(snapshot.periodFrom).toBe(bounds.start.toISOString());
  });
});
