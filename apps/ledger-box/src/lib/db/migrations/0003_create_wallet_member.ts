import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('wallet_member')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('wallet_id', 'text', (col) => col.notNull().references('wallet.id').onDelete('cascade'))
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text')
    .addColumn('role', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deleted_at', 'timestamptz')
    .addCheckConstraint('wallet_member_role_check', sql`role in ('viewer', 'manager')`)
    .addCheckConstraint('wallet_member_status_check', sql`status in ('active', 'pending')`)
    .execute();

  await db.schema.createIndex('wallet_member_wallet_id_index').on('wallet_member').column('wallet_id').execute();

  await sql`
    create unique index wallet_member_wallet_email_unique
    on wallet_member (wallet_id, lower(email))
    where deleted_at is null
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop index if exists wallet_member_wallet_email_unique`.execute(db);
  await db.schema.dropIndex('wallet_member_wallet_id_index').execute();
  await db.schema.dropTable('wallet_member').execute();
}
