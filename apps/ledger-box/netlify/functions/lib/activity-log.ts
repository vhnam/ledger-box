import type { Kysely, Transaction } from 'kysely';

import type { ActivityAction, ActivityEntityType, Database } from '#/lib/db/schema.ts';

type ActorContext = {
  userId: string;
  email: string;
};

type RecordActivityInput = {
  walletId: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  walletAmountDelta?: number | null;
};

type ActivityExecutor = Kysely<Database> | Transaction<Database>;

async function recordActivity(executor: ActivityExecutor, input: RecordActivityInput): Promise<void> {
  await executor
    .insertInto('walletActivityLog')
    .values({
      walletId: input.walletId,
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      beforeJson: input.before,
      afterJson: input.after,
      walletAmountDelta: input.walletAmountDelta ?? null,
      createdAt: new Date(),
    })
    .execute();
}

export { recordActivity, type ActorContext, type RecordActivityInput };
