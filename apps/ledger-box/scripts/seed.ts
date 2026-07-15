import { randomUUID } from 'node:crypto';

import { sql } from 'kysely';

import { db } from '../src/lib/db/index.ts';
import { SEED_WALLETS, type SeedTransaction } from '../src/lib/db/seed-data.ts';

function calculateWalletAmount(transactions: SeedTransaction[]): number {
  return transactions.reduce((total, transaction) => {
    return transaction.type === 'income' ? total + transaction.amount : total - transaction.amount;
  }, 0);
}

function walletTimestamps(transactions: SeedTransaction[]) {
  const now = new Date();

  if (transactions.length === 0) {
    return { createdAt: now, updatedAt: now };
  }

  const timestamps = transactions.map((transaction) => new Date(transaction.createdAt).getTime());

  return {
    createdAt: new Date(Math.min(...timestamps)),
    updatedAt: new Date(Math.max(...timestamps)),
  };
}

async function main() {
  await db.transaction().execute(async (trx) => {
    await sql`truncate table wallet cascade`.execute(trx);

    for (const wallet of SEED_WALLETS) {
      const walletId = randomUUID();
      const { createdAt, updatedAt } = walletTimestamps(wallet.transactions);

      await trx
        .insertInto('wallet')
        .values({
          id: walletId,
          name: wallet.name,
          amount: calculateWalletAmount(wallet.transactions),
          createdAt,
          updatedAt,
          deletedAt: null,
        })
        .execute();

      if (wallet.transactions.length === 0) {
        continue;
      }

      await trx
        .insertInto('transaction')
        .values(
          wallet.transactions.map((transaction) => ({
            id: randomUUID(),
            walletId,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            createdAt: transaction.createdAt,
            updatedAt: transaction.createdAt,
            deletedAt: null,
          })),
        )
        .execute();
    }
  });

  const transactionCount = SEED_WALLETS.reduce((total, wallet) => total + wallet.transactions.length, 0);

  console.log('✓ Truncated wallet and transaction tables');
  console.log(`✓ Seeded ${SEED_WALLETS.length} wallets`);
  console.log(`✓ Seeded ${transactionCount} transactions`);

  await db.destroy();
}

await main();
