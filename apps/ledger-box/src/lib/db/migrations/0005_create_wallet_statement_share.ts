import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('wallet_statement_share')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('wallet_id', 'text', (col) => col.notNull().references('wallet.id').onDelete('cascade'))
    .addColumn('tenant_id', 'text', (col) => col.notNull())
    .addColumn('period_from', 'date', (col) => col.notNull())
    .addColumn('period_to', 'date', (col) => col.notNull())
    .addColumn('token_hash', 'text', (col) => col.notNull().unique())
    .addColumn('display_title', 'text')
    .addColumn('expires_at', 'timestamptz')
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('snapshot_json', 'jsonb', (col) => col.notNull())
    .addColumn('snapshot_at', 'timestamptz', (col) => col.notNull())
    .addColumn('access_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('last_accessed_at', 'timestamptz')
    .addColumn('rate_window_start', 'timestamptz')
    .addColumn('rate_window_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`
    create index wallet_statement_share_wallet_id_index
    on wallet_statement_share (wallet_id)
    where revoked_at is null
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop index if exists wallet_statement_share_wallet_id_index`.execute(db);
  await db.schema.dropTable('wallet_statement_share').execute();
}
