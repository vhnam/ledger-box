import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';

import { pool } from './pool';
import { type Database } from './schema';

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
  plugins: [new CamelCasePlugin()],
});

export type { Database, NewTransaction, NewWallet, Transaction, TransactionType, Wallet } from './schema';
