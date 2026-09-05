import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`alter table wallet_activity_log drop constraint wallet_activity_log_action_check`.execute(db);
  await sql`
    alter table wallet_activity_log
    add constraint wallet_activity_log_action_check
    check (action in ('create','update','delete','transfer','invite','role_change','revoke','regenerate','rename','invite_resend','invite_email_failed'))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`alter table wallet_activity_log drop constraint wallet_activity_log_action_check`.execute(db);
  await sql`
    alter table wallet_activity_log
    add constraint wallet_activity_log_action_check
    check (action in ('create','update','delete','transfer','invite','role_change','revoke','rename','invite_resend','invite_email_failed'))
  `.execute(db);
}
