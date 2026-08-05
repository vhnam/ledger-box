import { type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('wallet')
    .addColumn('currency', 'text', (col) => col.notNull().defaultTo('VND'))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('wallet').dropColumn('currency').execute();
}
