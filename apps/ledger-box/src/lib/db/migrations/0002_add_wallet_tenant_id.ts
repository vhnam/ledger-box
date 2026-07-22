import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('wallet').addColumn('tenant_id', 'text').execute();

  // v1: tenant_id = better-auth user id. Assign existing wallets to the earliest user when present.
  await sql`
    update wallet
    set tenant_id = (
      select id
      from "user"
      order by "createdAt" asc nulls last
      limit 1
    )
    where tenant_id is null
      and exists (select 1 from "user")
  `.execute(db);

  // Orphan wallets (no users in the system) cannot be owned — drop them.
  await sql`delete from wallet where tenant_id is null`.execute(db);

  await sql`alter table wallet alter column tenant_id set not null`.execute(db);

  await db.schema.createIndex('wallet_tenant_id_index').on('wallet').column('tenant_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('wallet_tenant_id_index').execute();
  await db.schema.alterTable('wallet').dropColumn('tenant_id').execute();
}
