import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { db } from '#/lib/db/index.ts';

import {
  findAccessibleWallets,
  requireTransactionAccess,
  requireTransactionWriteAccess,
  requireWalletAccess,
  requireWalletWriteAccess,
} from './tenant-access.ts';

const ownerId = `owner-${randomUUID()}`;
const managerId = `manager-${randomUUID()}`;
const viewerEmail = `viewer-${randomUUID()}@example.com`;
const unrelatedId = `unrelated-${randomUUID()}`;

async function createWallet(): Promise<string> {
  const wallet = await db
    .insertInto('wallet')
    .values({ tenantId: ownerId, name: 'Test wallet', amount: 100, createdAt: new Date(), updatedAt: new Date() })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  return wallet.id;
}

async function createTransaction(walletId: string): Promise<string> {
  const transaction = await db
    .insertInto('transaction')
    .values({
      walletId,
      type: 'income',
      amount: 10,
      description: 'test',
      occurredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  return transaction.id;
}

async function inviteMember(
  walletId: string,
  role: 'manager' | 'viewer',
  options: { userId?: string; email: string; status?: 'active' | 'pending' },
): Promise<void> {
  await db
    .insertInto('walletMember')
    .values({
      walletId,
      email: options.email,
      userId: options.userId ?? null,
      role,
      status: options.status ?? 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .execute();
}

async function cleanup(walletId: string): Promise<void> {
  await db.deleteFrom('walletMember').where('walletId', '=', walletId).execute();
  await db.deleteFrom('transaction').where('walletId', '=', walletId).execute();
  await db.deleteFrom('wallet').where('id', '=', walletId).execute();
}

describe('requireWalletAccess', () => {
  let walletId: string;

  afterEach(async () => {
    if (walletId) {
      await cleanup(walletId);
    }
  });

  it('grants owner role when tenantId matches wallet.tenantId', async () => {
    walletId = await createWallet();

    const result = await requireWalletAccess(ownerId, walletId, 'owner@example.com');

    expect(result.ok).toBe(true);
    expect(result.ok && result.role).toBe('owner');
  });

  it('grants manager role for an active member matched by userId', async () => {
    walletId = await createWallet();
    await inviteMember(walletId, 'manager', { userId: managerId, email: 'manager@example.com', status: 'active' });

    const result = await requireWalletAccess(managerId, walletId, 'manager@example.com');

    expect(result.ok).toBe(true);
    expect(result.ok && result.role).toBe('manager');
  });

  it('grants viewer role and denies write access for a viewer', async () => {
    const viewerId = `viewer-${randomUUID()}`;

    walletId = await createWallet();
    await inviteMember(walletId, 'viewer', { userId: viewerId, email: viewerEmail, status: 'active' });

    const readResult = await requireWalletAccess(viewerId, walletId, viewerEmail);

    expect(readResult.ok).toBe(true);
    expect(readResult.ok && readResult.role).toBe('viewer');

    const writeResult = await requireWalletWriteAccess(viewerId, walletId, viewerEmail);

    expect(writeResult.ok).toBe(false);
    expect(!writeResult.ok && writeResult.error.status).toBe(403);
  });

  it('auto-activates a pending invite matched by user id and returns granted access', async () => {
    const pendingUserId = `pending-${randomUUID()}`;

    walletId = await createWallet();
    await inviteMember(walletId, 'manager', {
      userId: pendingUserId,
      email: 'pending@example.com',
      status: 'pending',
    });

    const result = await requireWalletAccess(pendingUserId, walletId, 'pending@example.com');

    expect(result.ok).toBe(true);

    const member = await db
      .selectFrom('walletMember')
      .select(['status', 'userId'])
      .where('walletId', '=', walletId)
      .executeTakeFirstOrThrow();

    expect(member.status).toBe('active');
    expect(member.userId).toBe(pendingUserId);
  });

  it('auto-activates and backfills userId for a pending invite matched only by email, case-insensitively', async () => {
    const registeringUserId = `registering-${randomUUID()}`;
    const invitedEmail = 'Invited.User@Example.com';

    walletId = await createWallet();
    await inviteMember(walletId, 'viewer', { email: invitedEmail, status: 'pending' });

    const result = await requireWalletAccess(registeringUserId, walletId, 'invited.user@example.com');

    expect(result.ok).toBe(true);

    const member = await db
      .selectFrom('walletMember')
      .select(['status', 'userId'])
      .where('walletId', '=', walletId)
      .executeTakeFirstOrThrow();

    expect(member.status).toBe('active');
    expect(member.userId).toBe(registeringUserId);
  });

  it('denies access with 404 for a user with no membership, indistinguishable from a missing wallet', async () => {
    walletId = await createWallet();

    const result = await requireWalletAccess(unrelatedId, walletId, 'unrelated@example.com');

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.status).toBe(404);

    const missingResult = await requireWalletAccess(unrelatedId, randomUUID(), 'unrelated@example.com');

    expect(missingResult.ok).toBe(false);
    expect(!missingResult.ok && missingResult.error.status).toBe(404);
  });
});

describe('requireTransactionAccess / requireTransactionWriteAccess', () => {
  let walletId: string;
  let transactionId: string;

  afterEach(async () => {
    if (walletId) {
      await cleanup(walletId);
    }
  });

  it('lets a manager read and write a transaction on their wallet', async () => {
    walletId = await createWallet();
    transactionId = await createTransaction(walletId);
    await inviteMember(walletId, 'manager', { userId: managerId, email: 'manager2@example.com', status: 'active' });

    const readResult = await requireTransactionAccess(managerId, walletId, transactionId, 'manager2@example.com');

    expect(readResult.ok).toBe(true);

    const writeResult = await requireTransactionWriteAccess(managerId, walletId, transactionId, 'manager2@example.com');

    expect(writeResult.ok).toBe(true);
  });

  it('lets a viewer read but not write a transaction on their wallet', async () => {
    const viewerId = `viewer-${randomUUID()}`;
    const email = `viewer2-${randomUUID()}@example.com`;

    walletId = await createWallet();
    transactionId = await createTransaction(walletId);
    await inviteMember(walletId, 'viewer', { userId: viewerId, email, status: 'active' });

    const readResult = await requireTransactionAccess(viewerId, walletId, transactionId, email);

    expect(readResult.ok).toBe(true);

    const writeResult = await requireTransactionWriteAccess(viewerId, walletId, transactionId, email);

    expect(writeResult.ok).toBe(false);
    expect(!writeResult.ok && writeResult.error.status).toBe(403);
  });
});

describe('findAccessibleWallets', () => {
  let walletId: string;

  afterEach(async () => {
    if (walletId) {
      await cleanup(walletId);
    }
  });

  it('includes wallets the tenant owns and wallets they have a member invite on (active or pending)', async () => {
    const memberId = `member-${randomUUID()}`;
    const email = `list-${randomUUID()}@example.com`;

    walletId = await createWallet();
    await inviteMember(walletId, 'viewer', { userId: memberId, email, status: 'pending' });

    const ownerWallets = await findAccessibleWallets(ownerId, 'owner@example.com');

    expect(ownerWallets.some((wallet) => wallet.id === walletId)).toBe(true);

    const memberWallets = await findAccessibleWallets(memberId, email);

    expect(memberWallets.some((wallet) => wallet.id === walletId)).toBe(true);

    const unrelatedWallets = await findAccessibleWallets(unrelatedId, 'unrelated@example.com');

    expect(unrelatedWallets.some((wallet) => wallet.id === walletId)).toBe(false);
  });
});
