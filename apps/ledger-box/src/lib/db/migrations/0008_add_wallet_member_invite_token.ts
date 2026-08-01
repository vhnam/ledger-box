import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('wallet_member')
    .addColumn('invite_token_hash', 'text')
    .addColumn('invite_token_expires_at', 'timestamptz')
    .addColumn('last_invited_at', 'timestamptz')
    .addColumn('invite_send_count', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await sql`
    create unique index wallet_member_invite_token_hash_index
    on wallet_member (invite_token_hash)
    where invite_token_hash is not null
  `.execute(db);

  await db.schema
    .alterTable('wallet')
    .addColumn('invite_rate_window_start', 'timestamptz')
    .addColumn('invite_rate_window_count', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await sql`alter table wallet_activity_log drop constraint wallet_activity_log_action_check`.execute(db);
  await sql`
    alter table wallet_activity_log
    add constraint wallet_activity_log_action_check
    check (action in ('create','update','delete','transfer','invite','role_change','revoke','rename','invite_resend','invite_email_failed'))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`alter table wallet_activity_log drop constraint wallet_activity_log_action_check`.execute(db);
  await sql`
    alter table wallet_activity_log
    add constraint wallet_activity_log_action_check
    check (action in ('create','update','delete','transfer','invite','role_change','revoke','rename'))
  `.execute(db);

  await db.schema.alterTable('wallet').dropColumn('invite_rate_window_count').execute();
  await db.schema.alterTable('wallet').dropColumn('invite_rate_window_start').execute();

  await sql`drop index if exists wallet_member_invite_token_hash_index`.execute(db);

  await db.schema.alterTable('wallet_member').dropColumn('invite_send_count').execute();
  await db.schema.alterTable('wallet_member').dropColumn('last_invited_at').execute();
  await db.schema.alterTable('wallet_member').dropColumn('invite_token_expires_at').execute();
  await db.schema.alterTable('wallet_member').dropColumn('invite_token_hash').execute();
}
