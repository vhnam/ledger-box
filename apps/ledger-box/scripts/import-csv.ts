import { readFileSync } from 'node:fs';

import { sql } from 'kysely';

import { db } from '../src/lib/db/index.ts';

function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split(/\r?\n/);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.replaceAll('"', '').trim());

  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
          inQuotes = !inQuotes;
          continue;
        }

        if (character === ',' && !inQuotes) {
          values.push(current);
          current = '';
          continue;
        }

        current += character;
      }

      values.push(current);

      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = (values[index] ?? '').trim();
      });

      return row;
    });
}

function nullIfEmpty(value: string): string | null {
  return value.length === 0 ? null : value;
}

async function main() {
  const walletPath = process.argv[2];
  const transactionPath = process.argv[3];

  if (!walletPath || !transactionPath) {
    throw new Error('Usage: tsx scripts/import-csv.ts <wallet.csv> <transaction.csv>');
  }

  const wallets = parseCsv(readFileSync(walletPath, 'utf8'));
  const transactions = parseCsv(readFileSync(transactionPath, 'utf8'));
  const tenantIds = [...new Set(wallets.map((wallet) => wallet.tenant_id).filter(Boolean))];

  console.log(`Parsed ${wallets.length} wallets, ${transactions.length} transactions`);
  console.log(`Tenant ids: ${tenantIds.join(', ') || '(none)'}`);

  for (const tenantId of tenantIds) {
    const user = await sql<{ id: string }>`select id from "user" where id = ${tenantId} limit 1`.execute(db);

    if (!user.rows[0]) {
      console.warn(`WARNING: no better-auth user for tenant ${tenantId}`);
    } else {
      console.log(`✓ tenant user exists: ${tenantId}`);
    }
  }

  await db.transaction().execute(async (trx) => {
    for (const wallet of wallets) {
      await trx
        .insertInto('wallet')
        .values({
          id: wallet.id,
          tenantId: wallet.tenant_id,
          name: wallet.name,
          amount: Number(wallet.amount),
          createdAt: wallet.created_at,
          updatedAt: wallet.updated_at,
          deletedAt: nullIfEmpty(wallet.deleted_at),
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            tenantId: wallet.tenant_id,
            name: wallet.name,
            amount: Number(wallet.amount),
            createdAt: wallet.created_at,
            updatedAt: wallet.updated_at,
            deletedAt: nullIfEmpty(wallet.deleted_at),
          }),
        )
        .execute();
    }

    for (const transaction of transactions) {
      await trx
        .insertInto('transaction')
        .values({
          id: transaction.id,
          walletId: transaction.wallet_id,
          type: transaction.type as 'income' | 'expense',
          amount: Number(transaction.amount),
          description: transaction.description,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
          deletedAt: nullIfEmpty(transaction.deleted_at),
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            walletId: transaction.wallet_id,
            type: transaction.type as 'income' | 'expense',
            amount: Number(transaction.amount),
            description: transaction.description,
            createdAt: transaction.created_at,
            updatedAt: transaction.updated_at,
            deletedAt: nullIfEmpty(transaction.deleted_at),
          }),
        )
        .execute();
    }
  });

  const walletCount = await sql<{ count: string }>`select count(*)::text as count from wallet`.execute(db);
  const transactionCount = await sql<{ count: string }>`select count(*)::text as count from transaction`.execute(db);

  console.log(
    `✓ Import complete. wallet=${walletCount.rows[0]?.count}, transaction=${transactionCount.rows[0]?.count}`,
  );

  await db.destroy();
}

await main();
