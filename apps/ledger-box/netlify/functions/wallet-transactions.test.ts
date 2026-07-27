import { randomUUID } from 'node:crypto';

import { sql } from 'kysely';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { db } from '#/lib/db/index.ts';
import type { TransactionType } from '#/lib/db/schema.ts';

const ownerId = `owner-${randomUUID()}`;

async function createWallet(amount: number): Promise<string> {
  const wallet = await db
    .insertInto('wallet')
    .values({ tenantId: ownerId, name: 'Test wallet', amount, createdAt: new Date(), updatedAt: new Date() })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  return wallet.id;
}

async function cleanup(walletId: string): Promise<void> {
  await db.deleteFrom('transaction').where('walletId', '=', walletId).execute();
  await db.deleteFrom('wallet').where('id', '=', walletId).execute();
}

/** Mirrors the POST /api/wallets/:walletId/transactions balance-mutation logic. */
async function addTransaction(walletId: string, type: TransactionType, amount: number): Promise<void> {
  const now = new Date();
  const delta = type === 'income' ? amount : -amount;

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('transaction')
      .values({
        walletId,
        type,
        amount,
        description: 'test',
        occurredAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    await trx
      .updateTable('wallet')
      .set({
        amount: sql`amount + ${delta}`,
        updatedAt: now,
      })
      .where('id', '=', walletId)
      .execute();
  });
}

async function getWalletAmount(walletId: string): Promise<number> {
  const wallet = await db.selectFrom('wallet').select(['amount']).where('id', '=', walletId).executeTakeFirstOrThrow();

  return wallet.amount;
}

async function sumTransactions(walletId: string): Promise<number> {
  const rows = await db
    .selectFrom('transaction')
    .select(['type', 'amount'])
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .execute();

  return rows.reduce((total, row) => total + (row.type === 'income' ? row.amount : -row.amount), 0);
}

describe('wallet balance concurrency', () => {
  let walletId: string;

  afterEach(async () => {
    if (walletId) {
      await cleanup(walletId);
    }
  });

  it('applies both deltas when two income transactions are added concurrently to the same wallet', async () => {
    const opening = 100;
    walletId = await createWallet(opening);

    await Promise.all([addTransaction(walletId, 'income', 10), addTransaction(walletId, 'income', 10)]);

    const net = await sumTransactions(walletId);
    expect(net).toBe(20);
    expect(await getWalletAmount(walletId)).toBe(opening + net);
  });

  it('applies both deltas when an income and an expense transaction are added concurrently to the same wallet', async () => {
    const opening = 100;
    walletId = await createWallet(opening);

    await Promise.all([addTransaction(walletId, 'income', 15), addTransaction(walletId, 'expense', 5)]);

    const net = await sumTransactions(walletId);
    expect(net).toBe(10);
    expect(await getWalletAmount(walletId)).toBe(opening + net);
  });
});
