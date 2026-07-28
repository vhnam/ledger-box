import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('wallet_activity_log')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('wallet_id', 'text', (col) => col.notNull())
    .addColumn('tenant_id', 'text', (col) => col.notNull())
    .addColumn('actor_user_id', 'text', (col) => col.notNull())
    .addColumn('actor_email', 'text', (col) => col.notNull())
    .addColumn('entity_type', 'text', (col) => col.notNull())
    .addColumn('entity_id', 'text', (col) => col.notNull())
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('before_json', 'jsonb')
    .addColumn('after_json', 'jsonb')
    .addColumn('wallet_amount_delta', sql`numeric(14, 2)`)
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addCheckConstraint(
      'wallet_activity_log_entity_type_check',
      sql`entity_type in ('transaction','wallet','wallet_member','statement_share','transfer')`,
    )
    .addCheckConstraint(
      'wallet_activity_log_action_check',
      sql`action in ('create','update','delete','transfer','invite','role_change','revoke','rename')`,
    )
    .execute();

  await sql`
    create index wallet_activity_log_wallet_id_created_at_index
    on wallet_activity_log (wallet_id, created_at desc)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop index if exists wallet_activity_log_wallet_id_created_at_index`.execute(db);
  await db.schema.dropTable('wallet_activity_log').execute();
}
