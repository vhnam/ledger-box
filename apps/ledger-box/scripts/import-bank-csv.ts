import { readFileSync } from 'node:fs';

import { sql } from 'kysely';

import { db } from '../src/lib/db/index.ts';
import type { TransactionType } from '../src/lib/db/schema.ts';

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

function isTransactionType(value: string): value is TransactionType {
  return value === 'income' || value === 'expense';
}

async function main() {
  const bankAccountsPath = process.argv[2];
  const transactionsPath = process.argv[3];

  if (!bankAccountsPath || !transactionsPath) {
    throw new Error('Usage: tsx scripts/import-bank-csv.ts <bank_accounts.csv> <transactions.csv>');
  }

  const accounts = parseCsv(readFileSync(bankAccountsPath, 'utf8'));
  const sourceTransactions = parseCsv(readFileSync(transactionsPath, 'utf8'));

  console.log(`Parsed ${accounts.length} bank accounts, ${sourceTransactions.length} transactions`);

  const tenantIds = [...new Set(accounts.map((account) => account.user_id).filter(Boolean))];

  for (const tenantId of tenantIds) {
    const user = await sql<{ id: string }>`select id from "user" where id = ${tenantId} limit 1`.execute(db);

    if (!user.rows[0]) {
      console.warn(`WARNING: no better-auth user for tenant ${tenantId}`);
    } else {
      console.log(`✓ tenant user exists: ${tenantId}`);
    }
  }

  const txsByAccount = new Map<string, typeof sourceTransactions>();

  for (const transaction of sourceTransactions) {
    const accountId = transaction.account_id;

    if (!accountId) {
      throw new Error(`Transaction ${transaction.id} is missing account_id`);
    }

    const list = txsByAccount.get(accountId) ?? [];
    list.push(transaction);
    txsByAccount.set(accountId, list);
  }

  await db.transaction().execute(async (trx) => {
    for (const account of accounts) {
      const accountTxs = txsByAccount.get(account.id) ?? [];
      let amount = 0;
      let createdAt = new Date().toISOString();
      let updatedAt = createdAt;

      if (accountTxs.length > 0) {
        const timestamps = accountTxs.map((transaction) => new Date(transaction.date).getTime());
        createdAt = new Date(Math.min(...timestamps)).toISOString();
        updatedAt = new Date(Math.max(...timestamps)).toISOString();

        amount = accountTxs.reduce((total, transaction) => {
          const value = Number(transaction.amount);

          if (!Number.isFinite(value)) {
            throw new Error(`Invalid amount on transaction ${transaction.id}`);
          }

          return transaction.type === 'income' ? total + value : total - value;
        }, 0);
      }

      await trx
        .insertInto('wallet')
        .values({
          id: account.id,
          tenantId: account.user_id,
          name: account.name,
          amount,
          createdAt,
          updatedAt,
          deletedAt: null,
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            tenantId: account.user_id,
            name: account.name,
            amount,
            createdAt,
            updatedAt,
            deletedAt: null,
          }),
        )
        .execute();
    }

    for (const transaction of sourceTransactions) {
      if (!isTransactionType(transaction.type)) {
        throw new Error(`Invalid transaction type on ${transaction.id}: ${transaction.type}`);
      }

      const amount = Number(transaction.amount);

      if (!Number.isFinite(amount)) {
        throw new Error(`Invalid amount on transaction ${transaction.id}`);
      }

      await trx
        .insertInto('transaction')
        .values({
          id: transaction.id,
          walletId: transaction.account_id,
          type: transaction.type,
          amount,
          description: transaction.description,
          createdAt: transaction.date,
          updatedAt: transaction.date,
          deletedAt: null,
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            walletId: transaction.account_id,
            type: transaction.type,
            amount,
            description: transaction.description,
            createdAt: transaction.date,
            updatedAt: transaction.date,
            deletedAt: null,
          }),
        )
        .execute();
    }
  });

  const walletCount = await sql<{ count: string }>`
    select count(*)::text as count
    from wallet
    where tenant_id = ${tenantIds[0] ?? ''}
  `.execute(db);
  const transactionCount = await sql<{ count: string }>`
    select count(*)::text as count
    from transaction
    where wallet_id in (
      select id from wallet where tenant_id = ${tenantIds[0] ?? ''}
    )
  `.execute(db);

  console.log(
    `✓ Import complete for tenant ${tenantIds[0] ?? '(none)'}: wallet=${walletCount.rows[0]?.count}, transaction=${transactionCount.rows[0]?.count}`,
  );

  await db.destroy();
}

await main();
