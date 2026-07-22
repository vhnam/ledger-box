import { db } from '../../../src/lib/db/index.ts';

type SessionLike = {
  user: {
    id: string;
  };
};

type OwnedWallet = {
  id: string;
  name: string;
  amount: number;
};

type OwnedTransaction = {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  amount: number;
};

/** v1: tenant id is the authenticated user id. */
function getTenantId(session: SessionLike): string {
  return session.user.id;
}

async function findOwnedWallet(tenantId: string, walletId: string): Promise<OwnedWallet | undefined> {
  return db
    .selectFrom('wallet')
    .select(['id', 'name', 'amount'])
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
    return { ok: false, error: new Response('Wallet not found', { status: 404 }) };
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
    return { ok: false, error: new Response('Transaction not found', { status: 404 }) };
  }

  return { ok: true, wallet: ownership.wallet, transaction };
}

export { findOwnedWallet, getTenantId, requireOwnedTransaction, requireOwnedWallet };
