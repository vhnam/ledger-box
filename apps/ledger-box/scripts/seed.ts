import { sql } from 'kysely';

import { db } from '#/lib/db/index.ts';

interface SeedTransaction {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  daysAgo: number;
}

const TRANSACTIONS: SeedTransaction[] = [
  { type: 'income', amount: 4500, description: 'Monthly salary', daysAgo: 28 },
  { type: 'income', amount: 250, description: 'Freelance web design project', daysAgo: 21 },
  { type: 'expense', amount: 1200, description: 'Rent payment', daysAgo: 27 },
  { type: 'expense', amount: 85.5, description: 'Grocery shopping at Whole Foods', daysAgo: 25 },
  { type: 'expense', amount: 42.3, description: 'Electricity bill', daysAgo: 24 },
  { type: 'expense', amount: 15.99, description: 'Netflix subscription', daysAgo: 20 },
  { type: 'expense', amount: 60, description: 'Dinner with friends', daysAgo: 18 },
  { type: 'expense', amount: 120, description: 'Gas and car maintenance', daysAgo: 16 },
  { type: 'expense', amount: 35.75, description: 'Pharmacy purchase', daysAgo: 14 },
  { type: 'income', amount: 100, description: 'Cashback reward', daysAgo: 12 },
  { type: 'expense', amount: 22.4, description: 'Coffee and lunch', daysAgo: 10 },
  { type: 'expense', amount: 300, description: 'New running shoes', daysAgo: 8 },
  { type: 'expense', amount: 18.5, description: 'Book purchase from Amazon', daysAgo: 6 },
  { type: 'expense', amount: 55, description: 'Gym membership', daysAgo: 4 },
  { type: 'income', amount: 75, description: 'Sold old furniture', daysAgo: 2 },
];

function daysAgoToDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function main() {
  const tenantId = process.argv[2];

  if (!tenantId) {
    throw new Error('Usage: tsx scripts/seed.ts <tenant-id>');
  }

  const user = await sql<{ id: string }>`select id from "user" where id = ${tenantId} limit 1`.execute(db);

  if (!user.rows[0]) {
    throw new Error(`No better-auth user found for tenant ${tenantId}`);
  }

  await db.transaction().execute(async (trx) => {
    const wallet = await trx
      .insertInto('wallet')
      .values({
        tenantId,
        name: 'Everyday Spending',
        amount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    let balance = 0;

    for (const transaction of TRANSACTIONS) {
      balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;

      const occurredAt = daysAgoToDate(transaction.daysAgo);

      await trx
        .insertInto('transaction')
        .values({
          walletId: wallet.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          occurredAt,
          createdAt: occurredAt,
          updatedAt: occurredAt,
        })
        .execute();
    }

    await trx.updateTable('wallet').set({ amount: balance }).where('id', '=', wallet.id).execute();

    console.log(`✓ Seeded wallet "${wallet.id}" with ${TRANSACTIONS.length} transactions, balance=${balance}`);
  });

  await db.destroy();
}

await main();
