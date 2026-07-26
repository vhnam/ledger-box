import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';

import { pool } from '#/lib/db/pool';
import { type Database } from '#/lib/db/schema';

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
  plugins: [new CamelCasePlugin()],
});

export type { Database, NewTransaction, NewWallet, Transaction, TransactionType, Wallet } from '#/lib/db/schema';
