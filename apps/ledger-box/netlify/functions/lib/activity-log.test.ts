import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { db } from '#/lib/db/index.ts';

import { recordActivity } from './activity-log.ts';
import { requireOwnedWallet } from './tenant-access.ts';
import {
  createTransaction,
  softDeleteTransaction,
  toTransactionSnapshot,
  transferBetweenWallets,
  updateTransaction,
} from './wallet-mutations.ts';

const ownerId = `owner-${randomUUID()}`;
const managerId = `manager-${randomUUID()}`;
const managerEmail = `manager-${randomUUID()}@example.com`;

async function createWallet(amount = 100): Promise<string> {
  const wallet = await db
    .insertInto('wallet')
    .values({ tenantId: ownerId, name: 'Activity wallet', amount, createdAt: new Date(), updatedAt: new Date() })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  return wallet.id;
}

async function inviteManager(walletId: string): Promise<void> {
  await db
    .insertInto('walletMember')
    .values({
      walletId,
      email: managerEmail,
      userId: managerId,
      role: 'manager',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .execute();
}

async function cleanup(walletIds: string[]): Promise<void> {
  for (const walletId of walletIds) {
    await db.deleteFrom('walletActivityLog').where('walletId', '=', walletId).execute();
    await db.deleteFrom('walletStatementShare').where('walletId', '=', walletId).execute();
    await db.deleteFrom('walletMember').where('walletId', '=', walletId).execute();
    await db.deleteFrom('transaction').where('walletId', '=', walletId).execute();
    await db.deleteFrom('wallet').where('id', '=', walletId).execute();
  }
}

async function listActivity(walletId: string) {
  return db
    .selectFrom('walletActivityLog')
    .selectAll()
    .where('walletId', '=', walletId)
    .orderBy('createdAt', 'asc')
    .execute();
}

describe('wallet activity log', () => {
  const walletIds: string[] = [];

  afterEach(async () => {
    await cleanup(walletIds.splice(0, walletIds.length));
  });

  it('records manager transaction create/update/delete with actor and owning tenant', async () => {
    const walletId = await createWallet(50);
    walletIds.push(walletId);
    await inviteManager(walletId);

    const actor = { userId: managerId, email: managerEmail };

    const created = await db.transaction().execute(async (trx) =>
      createTransaction(trx, {
        walletId,
        tenantId: ownerId,
        actor,
        type: 'income',
        amount: 20,
        description: 'manager top-up',
        occurredAt: new Date('2026-01-15T00:00:00.000Z'),
      }),
    );

    let logs = await listActivity(walletId);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.actorUserId).toBe(managerId);
    expect(logs[0]?.tenantId).toBe(ownerId);
    expect(logs[0]?.action).toBe('create');
    expect(logs[0]?.walletAmountDelta).toBe(20);
    expect(logs[0]?.entityId).toBe(created.id);

    const existing = toTransactionSnapshot({
      type: 'income',
      amount: 20,
      description: 'manager top-up',
      occurredAt: '2026-01-15T00:00:00.000Z',
    });

    await db.transaction().execute(async (trx) =>
      updateTransaction(trx, {
        walletId,
        tenantId: ownerId,
        actor,
        transactionId: created.id,
        existing,
        type: 'expense',
        amount: 5,
        description: 'manager spend',
      }),
    );

    logs = await listActivity(walletId);
    expect(logs).toHaveLength(2);
    expect(logs[1]?.action).toBe('update');
    expect(logs[1]?.walletAmountDelta).toBe(-25);

    const afterUpdate = toTransactionSnapshot({
      type: 'expense',
      amount: 5,
      description: 'manager spend',
      occurredAt: '2026-01-15T00:00:00.000Z',
    });

    await db.transaction().execute(async (trx) =>
      softDeleteTransaction(trx, {
        walletId,
        tenantId: ownerId,
        actor,
        transactionId: created.id,
        existing: afterUpdate,
      }),
    );

    logs = await listActivity(walletId);
    expect(logs).toHaveLength(3);
    expect(logs[2]?.action).toBe('delete');
    expect(logs[2]?.walletAmountDelta).toBe(5);
    expect(logs[2]?.entityId).toBe(created.id);
  });

  it('writes transfer activity on both wallets with opposite deltas', async () => {
    const fromWalletId = await createWallet(100);
    const toWalletId = await createWallet(10);
    walletIds.push(fromWalletId, toWalletId);

    const result = await db.transaction().execute(async (trx) =>
      transferBetweenWallets(trx, {
        actor: { userId: ownerId, email: 'owner@example.com' },
        fromWalletId,
        fromTenantId: ownerId,
        toWalletId,
        toTenantId: ownerId,
        amount: 30,
        description: '[A] → [B]: note',
        occurredAt: new Date('2026-02-01T12:00:00.000Z'),
      }),
    );

    const fromLogs = await listActivity(fromWalletId);
    const toLogs = await listActivity(toWalletId);

    expect(fromLogs).toHaveLength(1);
    expect(toLogs).toHaveLength(1);
    expect(fromLogs[0]?.action).toBe('transfer');
    expect(toLogs[0]?.action).toBe('transfer');
    expect(fromLogs[0]?.walletAmountDelta).toBe(-30);
    expect(toLogs[0]?.walletAmountDelta).toBe(30);
    expect(fromLogs[0]?.entityId).toBe(result.fromTransactionId);
    expect(toLogs[0]?.entityId).toBe(result.toTransactionId);
    const transferAfter = fromLogs[0]?.afterJson as { occurredAt?: string } | null;
    expect(transferAfter?.occurredAt).toBe('2026-02-01T12:00:00.000Z');
  });

  it('keeps activity rows after soft-deleting a transaction', async () => {
    const walletId = await createWallet();
    walletIds.push(walletId);

    const created = await db.transaction().execute(async (trx) =>
      createTransaction(trx, {
        walletId,
        tenantId: ownerId,
        actor: { userId: ownerId, email: 'owner@example.com' },
        type: 'income',
        amount: 12,
        description: 'keep me',
        occurredAt: new Date(),
      }),
    );

    await db.transaction().execute(async (trx) =>
      softDeleteTransaction(trx, {
        walletId,
        tenantId: ownerId,
        actor: { userId: ownerId, email: 'owner@example.com' },
        transactionId: created.id,
        existing: toTransactionSnapshot({
          type: 'income',
          amount: 12,
          description: 'keep me',
          occurredAt: new Date().toISOString(),
        }),
      }),
    );

    const logs = await listActivity(walletId);
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.every((row) => row.entityId === created.id || row.action === 'create' || row.action === 'delete')).toBe(
      true,
    );
  });

  it('logs member invite, role change, and remove', async () => {
    const walletId = await createWallet();
    walletIds.push(walletId);
    const actor = { userId: ownerId, email: 'owner@example.com' };

    const member = await db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('walletMember')
        .values({
          walletId,
          email: 'invitee@example.com',
          userId: null,
          role: 'viewer',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning(['id', 'email', 'role', 'status'])
        .executeTakeFirstOrThrow();

      await recordActivity(trx, {
        walletId,
        tenantId: ownerId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'wallet_member',
        entityId: created.id,
        action: 'invite',
        before: null,
        after: { email: created.email, role: created.role, status: created.status },
      });

      return created;
    });

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('walletMember')
        .set({ role: 'manager', updatedAt: new Date() })
        .where('id', '=', member.id)
        .execute();
      await recordActivity(trx, {
        walletId,
        tenantId: ownerId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'wallet_member',
        entityId: member.id,
        action: 'role_change',
        before: { email: member.email, role: 'viewer' },
        after: { email: member.email, role: 'manager' },
      });
    });

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('walletMember')
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where('id', '=', member.id)
        .execute();
      await recordActivity(trx, {
        walletId,
        tenantId: ownerId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'wallet_member',
        entityId: member.id,
        action: 'delete',
        before: { email: member.email, role: 'manager', status: 'pending' },
        after: null,
      });
    });

    const logs = await listActivity(walletId);
    expect(logs.map((row) => row.action)).toEqual(['invite', 'role_change', 'delete']);
  });

  it('does not log statement share preview but logs create and revoke', async () => {
    const walletId = await createWallet();
    walletIds.push(walletId);
    const actor = { userId: ownerId, email: 'owner@example.com' };

    expect(await listActivity(walletId)).toHaveLength(0);

    const share = await db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('walletStatementShare')
        .values({
          walletId,
          tenantId: ownerId,
          periodFrom: '2026-01-01',
          periodTo: '2026-01-31',
          tokenHash: `hash-${randomUUID()}`,
          displayTitle: 'Jan',
          expiresAt: null,
          snapshotJson: { rows: [] },
          snapshotAt: new Date(),
        })
        .returning(['id', 'periodFrom', 'periodTo', 'displayTitle', 'snapshotAt'])
        .executeTakeFirstOrThrow();

      await recordActivity(trx, {
        walletId,
        tenantId: ownerId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'statement_share',
        entityId: created.id,
        action: 'create',
        before: null,
        after: {
          periodFrom: '2026-01-01',
          periodTo: '2026-01-31',
          displayTitle: 'Jan',
          expiresAt: null,
          snapshotAt: new Date(created.snapshotAt).toISOString(),
        },
      });

      return created;
    });

    expect(await listActivity(walletId)).toHaveLength(1);

    await db.transaction().execute(async (trx) => {
      const revokedAt = new Date();
      await trx.updateTable('walletStatementShare').set({ revokedAt }).where('id', '=', share.id).execute();
      await recordActivity(trx, {
        walletId,
        tenantId: ownerId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'statement_share',
        entityId: share.id,
        action: 'revoke',
        before: { shareId: share.id },
        after: { revokedAt: revokedAt.toISOString() },
      });
    });

    expect((await listActivity(walletId)).map((row) => row.action)).toEqual(['create', 'revoke']);
  });

  it('denies non-owner activity access via requireOwnedWallet', async () => {
    const walletId = await createWallet();
    walletIds.push(walletId);
    await inviteManager(walletId);

    const managerAccess = await requireOwnedWallet(managerId, walletId);
    expect(managerAccess.ok).toBe(false);

    const ownerAccess = await requireOwnedWallet(ownerId, walletId);
    expect(ownerAccess.ok).toBe(true);
  });

  it('rolls back ledger write when activity insert fails in the same transaction', async () => {
    const walletId = await createWallet(40);
    walletIds.push(walletId);

    const before = await db
      .selectFrom('wallet')
      .select(['amount'])
      .where('id', '=', walletId)
      .executeTakeFirstOrThrow();

    await expect(
      db.transaction().execute(async (trx) => {
        await trx.updateTable('wallet').set({ amount: 99, updatedAt: new Date() }).where('id', '=', walletId).execute();

        await trx
          .insertInto('walletActivityLog')
          .values({
            walletId,
            tenantId: ownerId,
            actorUserId: ownerId,
            actorEmail: 'owner@example.com',
            // Invalid entity_type — check constraint must fail and roll back the wallet update.
            entityType: 'not_a_real_type' as 'transaction',
            entityId: randomUUID(),
            action: 'create',
            beforeJson: null,
            afterJson: null,
            walletAmountDelta: 1,
            createdAt: new Date(),
          })
          .execute();
      }),
    ).rejects.toThrow();

    const after = await db.selectFrom('wallet').select(['amount']).where('id', '=', walletId).executeTakeFirstOrThrow();
    expect(after.amount).toBe(before.amount);
  });
});
