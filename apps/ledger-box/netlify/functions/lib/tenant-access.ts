import { db } from '#/lib/db/index.ts';

type SessionLike = {
  user: {
    id: string;
    email: string;
  };
};

type OwnedWallet = {
  id: string;
  tenantId: string;
  name: string;
  amount: number;
  timezone: string;
};

type OwnedTransaction = {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  amount: number;
};

type WalletAccessRole = 'owner' | 'manager' | 'viewer';

type WalletAccessResult = { ok: true; wallet: OwnedWallet; role: WalletAccessRole } | { ok: false; error: Response };

type TransactionAccessResult =
  | { ok: true; wallet: OwnedWallet; role: WalletAccessRole; transaction: OwnedTransaction }
  | { ok: false; error: Response };

const WALLET_NOT_FOUND = new Response('Wallet not found', { status: 404 });
const TRANSACTION_NOT_FOUND = new Response('Transaction not found', { status: 404 });
const READ_ONLY_ACCESS = new Response('Read-only access', { status: 403 });

/** v1: tenant id is the authenticated user id. */
function getTenantId(session: SessionLike): string {
  return session.user.id;
}

async function findOwnedWallet(tenantId: string, walletId: string): Promise<OwnedWallet | undefined> {
  return db
    .selectFrom('wallet')
    .select(['id', 'tenantId', 'name', 'amount', 'timezone'])
    .where('id', '=', walletId)
    .where('tenantId', '=', tenantId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();
}

async function requireOwnedWallet(
  tenantId: string,
  walletId: string,
): Promise<{ ok: true; wallet: OwnedWallet } | { ok: false; error: Response }> {
  const wallet = await findOwnedWallet(tenantId, walletId);

  if (!wallet) {
    return { ok: false, error: WALLET_NOT_FOUND };
  }

  return { ok: true, wallet };
}

async function requireOwnedTransaction(
  tenantId: string,
  walletId: string,
  transactionId: string,
): Promise<{ ok: true; wallet: OwnedWallet; transaction: OwnedTransaction } | { ok: false; error: Response }> {
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership;
  }

  const transaction = await db
    .selectFrom('transaction')
    .select(['id', 'walletId', 'type', 'amount'])
    .where('id', '=', transactionId)
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();

  if (!transaction) {
    return { ok: false, error: TRANSACTION_NOT_FOUND };
  }

  return { ok: true, wallet: ownership.wallet, transaction };
}

/**
 * Resolves owner/manager/viewer access for a wallet, auto-activating a pending
 * `wallet_member` invite that matches the session's own identity. Denials are always
 * "Wallet not found" so unauthorized callers can't distinguish missing from
 * inaccessible wallets.
 */
async function requireWalletAccess(
  tenantId: string,
  walletId: string,
  sessionEmail: string,
): Promise<WalletAccessResult> {
  const wallet = await db
    .selectFrom('wallet')
    .select(['id', 'tenantId', 'name', 'amount', 'timezone'])
    .where('id', '=', walletId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();

  if (!wallet) {
    return { ok: false, error: WALLET_NOT_FOUND };
  }

  if (wallet.tenantId === tenantId) {
    return { ok: true, wallet, role: 'owner' };
  }

  const normalizedEmail = sessionEmail.toLowerCase();

  const member = await db
    .selectFrom('walletMember')
    .select(['id', 'role', 'status'])
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .where((eb) =>
      eb.or([
        eb('userId', '=', tenantId),
        eb.and([eb('userId', 'is', null), eb(eb.fn('lower', ['email']), '=', normalizedEmail)]),
      ]),
    )
    .executeTakeFirst();

  if (!member) {
    return { ok: false, error: WALLET_NOT_FOUND };
  }

  if (member.status === 'pending') {
    await db
      .updateTable('walletMember')
      .set({ status: 'active', userId: tenantId, updatedAt: new Date() })
      .where('id', '=', member.id)
      .execute();
  }

  return { ok: true, wallet, role: member.role };
}

async function requireWalletWriteAccess(
  tenantId: string,
  walletId: string,
  sessionEmail: string,
): Promise<WalletAccessResult> {
  const access = await requireWalletAccess(tenantId, walletId, sessionEmail);

  if (!access.ok) {
    return access;
  }

  if (access.role === 'viewer') {
    return { ok: false, error: READ_ONLY_ACCESS };
  }

  return access;
}

async function requireTransactionAccess(
  tenantId: string,
  walletId: string,
  transactionId: string,
  sessionEmail: string,
): Promise<TransactionAccessResult> {
  const access = await requireWalletAccess(tenantId, walletId, sessionEmail);

  if (!access.ok) {
    return access;
  }

  const transaction = await db
    .selectFrom('transaction')
    .select(['id', 'walletId', 'type', 'amount'])
    .where('id', '=', transactionId)
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();

  if (!transaction) {
    return { ok: false, error: TRANSACTION_NOT_FOUND };
  }

  return { ok: true, wallet: access.wallet, role: access.role, transaction };
}

async function requireTransactionWriteAccess(
  tenantId: string,
  walletId: string,
  transactionId: string,
  sessionEmail: string,
): Promise<TransactionAccessResult> {
  const access = await requireTransactionAccess(tenantId, walletId, transactionId, sessionEmail);

  if (!access.ok) {
    return access;
  }

  if (access.role === 'viewer') {
    return { ok: false, error: READ_ONLY_ACCESS };
  }

  return access;
}

/** Wallets the tenant owns, unioned with wallets they have an (active or pending) invite on. */
async function findAccessibleWallets(tenantId: string, sessionEmail: string): Promise<OwnedWallet[]> {
  const normalizedEmail = sessionEmail.toLowerCase();

  const owned = db
    .selectFrom('wallet')
    .select(['id', 'tenantId', 'name', 'amount', 'timezone'])
    .where('tenantId', '=', tenantId)
    .where('deletedAt', 'is', null);

  const member = db
    .selectFrom('wallet')
    .innerJoin('walletMember', 'walletMember.walletId', 'wallet.id')
    .select(['wallet.id', 'wallet.tenantId', 'wallet.name', 'wallet.amount', 'wallet.timezone'])
    .where('wallet.deletedAt', 'is', null)
    .where('walletMember.deletedAt', 'is', null)
    .where('walletMember.status', 'in', ['active', 'pending'])
    .where((eb) =>
      eb.or([
        eb('walletMember.userId', '=', tenantId),
        eb.and([
          eb('walletMember.userId', 'is', null),
          eb(eb.fn('lower', ['walletMember.email']), '=', normalizedEmail),
        ]),
      ]),
    );

  const wallets = await owned.unionAll(member).execute();

  return [...wallets].sort((left, right) => left.name.localeCompare(right.name));
}

export {
  findAccessibleWallets,
  findOwnedWallet,
  getTenantId,
  requireOwnedTransaction,
  requireOwnedWallet,
  requireTransactionAccess,
  requireTransactionWriteAccess,
  requireWalletAccess,
  requireWalletWriteAccess,
  type WalletAccessRole,
};
