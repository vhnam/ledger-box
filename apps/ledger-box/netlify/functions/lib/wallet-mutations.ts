import { type Transaction, sql } from 'kysely';

import type { Database, TransactionType } from '#/lib/db/schema.ts';

import { recordActivity, type ActorContext } from './activity-log.ts';

type TransactionFieldSnapshot = {
  type: TransactionType;
  amount: number;
  description: string;
  occurredAt: string;
};

type MoneyMutationBase = {
  walletId: string;
  tenantId: string;
  actor: ActorContext;
};

function getContribution(type: TransactionType, amount: number): number {
  return type === 'income' ? amount : -amount;
}

function toOccurredAtIso(value: Date | string): string {
  return new Date(value).toISOString();
}

function toTransactionSnapshot(input: {
  type: TransactionType;
  amount: number;
  description: string;
  occurredAt: Date | string;
}): TransactionFieldSnapshot {
  return {
    type: input.type,
    amount: input.amount,
    description: input.description,
    occurredAt: toOccurredAtIso(input.occurredAt),
  };
}

async function createTransaction(
  trx: Transaction<Database>,
  args: MoneyMutationBase & {
    type: TransactionType;
    amount: number;
    description: string;
    occurredAt: Date;
  },
): Promise<{ id: string }> {
  const now = new Date();
  const delta = getContribution(args.type, args.amount);
  const after = toTransactionSnapshot(args);

  const created = await trx
    .insertInto('transaction')
    .values({
      walletId: args.walletId,
      type: args.type,
      amount: args.amount,
      description: args.description,
      occurredAt: args.occurredAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  await trx
    .updateTable('wallet')
    .set({
      amount: sql`amount + ${delta}`,
      updatedAt: now,
    })
    .where('id', '=', args.walletId)
    .execute();

  await recordActivity(trx, {
    walletId: args.walletId,
    tenantId: args.tenantId,
    actorUserId: args.actor.userId,
    actorEmail: args.actor.email,
    entityType: 'transaction',
    entityId: created.id,
    action: 'create',
    before: null,
    after,
    walletAmountDelta: delta,
  });

  return { id: created.id };
}

async function updateTransaction(
  trx: Transaction<Database>,
  args: MoneyMutationBase & {
    transactionId: string;
    existing: TransactionFieldSnapshot;
    type: TransactionType;
    amount: number;
    description: string;
    occurredAt?: Date;
  },
): Promise<void> {
  const now = new Date();
  const afterOccurredAt = args.occurredAt ? toOccurredAtIso(args.occurredAt) : args.existing.occurredAt;
  const after = toTransactionSnapshot({
    type: args.type,
    amount: args.amount,
    description: args.description,
    occurredAt: afterOccurredAt,
  });
  const walletDelta =
    getContribution(args.type, args.amount) - getContribution(args.existing.type, args.existing.amount);

  await trx
    .updateTable('transaction')
    .set({
      type: args.type,
      amount: args.amount,
      description: args.description,
      updatedAt: now,
      ...(args.occurredAt ? { occurredAt: args.occurredAt } : {}),
    })
    .where('id', '=', args.transactionId)
    .execute();

  await trx
    .updateTable('wallet')
    .set({
      amount: sql`amount + ${walletDelta}`,
      updatedAt: now,
    })
    .where('id', '=', args.walletId)
    .execute();

  await recordActivity(trx, {
    walletId: args.walletId,
    tenantId: args.tenantId,
    actorUserId: args.actor.userId,
    actorEmail: args.actor.email,
    entityType: 'transaction',
    entityId: args.transactionId,
    action: 'update',
    before: args.existing,
    after,
    walletAmountDelta: walletDelta,
  });
}

async function softDeleteTransaction(
  trx: Transaction<Database>,
  args: MoneyMutationBase & {
    transactionId: string;
    existing: TransactionFieldSnapshot;
  },
): Promise<void> {
  const now = new Date();
  const walletDelta = -getContribution(args.existing.type, args.existing.amount);

  await trx
    .updateTable('transaction')
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where('id', '=', args.transactionId)
    .execute();

  await trx
    .updateTable('wallet')
    .set({
      amount: sql`amount + ${walletDelta}`,
      updatedAt: now,
    })
    .where('id', '=', args.walletId)
    .execute();

  await recordActivity(trx, {
    walletId: args.walletId,
    tenantId: args.tenantId,
    actorUserId: args.actor.userId,
    actorEmail: args.actor.email,
    entityType: 'transaction',
    entityId: args.transactionId,
    action: 'delete',
    before: args.existing,
    after: null,
    walletAmountDelta: walletDelta,
  });
}

async function transferBetweenWallets(
  trx: Transaction<Database>,
  args: {
    actor: ActorContext;
    fromWalletId: string;
    fromTenantId: string;
    toWalletId: string;
    toTenantId: string;
    amount: number;
    description: string;
    occurredAt: Date;
  },
): Promise<{ fromTransactionId: string; toTransactionId: string }> {
  const now = new Date();
  const occurredAtIso = toOccurredAtIso(args.occurredAt);

  const fromTransaction = await trx
    .insertInto('transaction')
    .values({
      walletId: args.fromWalletId,
      type: 'expense',
      amount: args.amount,
      description: args.description,
      occurredAt: args.occurredAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  const toTransaction = await trx
    .insertInto('transaction')
    .values({
      walletId: args.toWalletId,
      type: 'income',
      amount: args.amount,
      description: args.description,
      occurredAt: args.occurredAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  await trx
    .updateTable('wallet')
    .set({
      amount: sql`amount - ${args.amount}`,
      updatedAt: now,
    })
    .where('id', '=', args.fromWalletId)
    .execute();

  await trx
    .updateTable('wallet')
    .set({
      amount: sql`amount + ${args.amount}`,
      updatedAt: now,
    })
    .where('id', '=', args.toWalletId)
    .execute();

  const transferAfter = {
    fromWalletId: args.fromWalletId,
    toWalletId: args.toWalletId,
    fromTransactionId: fromTransaction.id,
    toTransactionId: toTransaction.id,
    amount: args.amount,
    description: args.description,
    occurredAt: occurredAtIso,
  };

  await recordActivity(trx, {
    walletId: args.fromWalletId,
    tenantId: args.fromTenantId,
    actorUserId: args.actor.userId,
    actorEmail: args.actor.email,
    entityType: 'transfer',
    entityId: fromTransaction.id,
    action: 'transfer',
    before: null,
    after: transferAfter,
    walletAmountDelta: -args.amount,
  });

  await recordActivity(trx, {
    walletId: args.toWalletId,
    tenantId: args.toTenantId,
    actorUserId: args.actor.userId,
    actorEmail: args.actor.email,
    entityType: 'transfer',
    entityId: toTransaction.id,
    action: 'transfer',
    before: null,
    after: transferAfter,
    walletAmountDelta: args.amount,
  });

  return { fromTransactionId: fromTransaction.id, toTransactionId: toTransaction.id };
}

export {
  createTransaction,
  getContribution,
  softDeleteTransaction,
  toTransactionSnapshot,
  transferBetweenWallets,
  updateTransaction,
  type TransactionFieldSnapshot,
};
