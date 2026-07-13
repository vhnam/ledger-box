import { sql } from 'kysely';

import { db } from '../src/lib/db/index.ts';
import { SEED_WALLETS } from '../src/lib/db/seed-data.ts';

async function main() {
  await db.transaction().execute(async (trx) => {
    await sql`truncate table wallet cascade`.execute(trx);

    for (const wallet of SEED_WALLETS) {
      await trx.insertInto('wallet').values({ id: wallet.id, name: wallet.name }).execute();

      if (wallet.transactions.length === 0) {
        continue;
      }

      await trx
        .insertInto('transaction')
        .values(
          wallet.transactions.map((transaction) => ({
            id: transaction.id,
            walletId: wallet.id,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            datetime: transaction.datetime,
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
