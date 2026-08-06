import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import type { TransactionType } from '#/lib/db/schema.ts';
import { calendarDateToOccurredAtStart } from '#/lib/period-bounds.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireTransactionWriteAccess } from './lib/tenant-access.ts';
import { softDeleteTransaction, toTransactionSnapshot, updateTransaction } from './lib/wallet-mutations.ts';

type UpdateTransactionBody = {
  type?: unknown;
  amount?: unknown;
  description?: unknown;
  occurredAt?: unknown;
};

function getIds(request: Request, context: Context): { walletId: string | null; transactionId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramTransactionId = context.params?.transactionId;

  if (
    typeof paramWalletId === 'string' &&
    paramWalletId.length > 0 &&
    typeof paramTransactionId === 'string' &&
    paramTransactionId.length > 0
  ) {
    return { walletId: paramWalletId, transactionId: paramTransactionId };
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/transactions\/([^/]+)$/);

  return {
    walletId: match?.[1] ?? null,
    transactionId: match?.[2] ?? null,
  };
}

function isValidTransactionType(value: unknown): value is TransactionType {
  return value === 'income' || value === 'expense';
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  if (request.method !== 'PATCH' && request.method !== 'DELETE') {
    return ApiErrors.methodNotAllowed();
  }

  const { walletId, transactionId } = getIds(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  if (!transactionId) {
    return apiError('TRANSACTION_ID_REQUIRED', 400);
  }

  const tenantId = getTenantId(session);
  const access = await requireTransactionWriteAccess(tenantId, walletId, transactionId, session.user.email);

  if (!access.ok) {
    return access.error;
  }

  const { wallet, transaction: existingTransaction } = access;
  const actor = { userId: session.user.id, email: session.user.email };
  const existing = toTransactionSnapshot(existingTransaction);

  if (request.method === 'DELETE') {
    await db.transaction().execute(async (trx) => {
      await softDeleteTransaction(trx, {
        walletId,
        tenantId: wallet.tenantId,
        actor,
        transactionId,
        existing,
      });
    });

    return Response.json({ success: true });
  }

  const body = (await request.json()) as UpdateTransactionBody;

  if (!isValidTransactionType(body.type)) {
    return apiError('INVALID_TRANSACTION_TYPE', 400);
  }

  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
    return apiError('AMOUNT_MUST_BE_POSITIVE', 400);
  }

  if (typeof body.description !== 'string' || body.description.trim().length === 0) {
    return apiError('DESCRIPTION_REQUIRED', 400);
  }

  if (body.occurredAt !== undefined && typeof body.occurredAt !== 'string') {
    return apiError('OCCURRED_AT_INVALID', 400);
  }

  const type = body.type;
  const amount = body.amount;
  const description = body.description.trim();
  // Only change occurred_at when the caller explicitly provides a date; amount/description
  // edits alone must not shift the transaction's period.
  const occurredAt = body.occurredAt ? calendarDateToOccurredAtStart(wallet.timezone, body.occurredAt) : undefined;

  await db.transaction().execute(async (trx) => {
    await updateTransaction(trx, {
      walletId,
      tenantId: wallet.tenantId,
      actor,
      transactionId,
      existing,
      type,
      amount,
      description,
      occurredAt,
    });
  });

  return Response.json({ success: true });
};

export const config: Config = {
  path: '/api/wallets/:walletId/transactions/:transactionId',
};
