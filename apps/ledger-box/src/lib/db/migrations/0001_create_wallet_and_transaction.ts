import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('wallet')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('transaction')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('wallet_id', 'text', (col) => col.notNull().references('wallet.id').onDelete('cascade'))
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('amount', 'numeric(14, 2)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('datetime', 'timestamptz', (col) => col.notNull())
    .addCheckConstraint('transaction_type_check', sql`type in ('income', 'expense')`)
    .execute();

  await db.schema.createIndex('transaction_wallet_id_index').on('transaction').column('wallet_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('transaction').execute();
  await db.schema.dropTable('wallet').execute();
}
