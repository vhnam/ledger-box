import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create index wallet_member_user_id_status_index
    on wallet_member (user_id, status)
    where deleted_at is null
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop index if exists wallet_member_user_id_status_index`.execute(db);
}
