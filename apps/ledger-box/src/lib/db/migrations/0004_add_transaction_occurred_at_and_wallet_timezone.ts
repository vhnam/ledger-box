import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('wallet')
    .addColumn('timezone', 'text', (col) => col.notNull().defaultTo('Asia/Ho_Chi_Minh'))
    .execute();

  await db.schema.alterTable('transaction').addColumn('occurred_at', 'timestamptz').execute();

  await sql`update "transaction" set "occurred_at" = "created_at" where "occurred_at" is null`.execute(db);

  await db.schema
    .alterTable('transaction')
    .alterColumn('occurred_at', (col) => col.setNotNull())
    .execute();

  await sql`
    create index transaction_wallet_id_occurred_at_index
    on transaction (wallet_id, occurred_at)
    where deleted_at is null
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop index if exists transaction_wallet_id_occurred_at_index`.execute(db);
  await db.schema.alterTable('transaction').dropColumn('occurred_at').execute();
  await db.schema.alterTable('wallet').dropColumn('timezone').execute();
}
