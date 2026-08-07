import type { Config } from '@netlify/functions';

import { auth } from '#/lib/auth/auth.ts';
import { db } from '#/lib/db/index.ts';
import { calendarDateToOccurredAtStart } from '#/utils/wallet/period-bounds.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireWalletWriteAccess } from './lib/tenant-access.ts';
import { transferBetweenWallets } from './lib/wallet-mutations.ts';

type TransferMoneyBody = {
  fromWalletId?: unknown;
  toWalletId?: unknown;
  amount?: unknown;
  note?: unknown;
  occurredAt?: unknown;
};

function buildTransferDescription(fromWalletName: string, toWalletName: string, note: string): string {
  return `[${fromWalletName}] → [${toWalletName}]: ${note}`;
}

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  if (request.method !== 'POST') {
    return ApiErrors.methodNotAllowed();
  }

  const tenantId = getTenantId(session);
  const body = (await request.json()) as TransferMoneyBody;

  if (typeof body.fromWalletId !== 'string' || body.fromWalletId.trim().length === 0) {
    return apiError('SOURCE_WALLET_REQUIRED', 400);
  }

  if (typeof body.toWalletId !== 'string' || body.toWalletId.trim().length === 0) {
    return apiError('DESTINATION_WALLET_REQUIRED', 400);
  }

  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
    return apiError('AMOUNT_MUST_BE_POSITIVE', 400);
  }

  if (typeof body.note !== 'string' || body.note.trim().length === 0) {
    return apiError('NOTE_REQUIRED', 400);
  }

  if (body.occurredAt !== undefined && typeof body.occurredAt !== 'string') {
    return apiError('OCCURRED_AT_INVALID', 400);
  }

  const fromWalletId = body.fromWalletId.trim();
  const toWalletId = body.toWalletId.trim();
  const amount = body.amount;
  const note = body.note.trim();

  if (fromWalletId === toWalletId) {
    return apiError('TRANSFER_SAME_WALLET', 400);
  }

  const fromAccess = await requireWalletWriteAccess(tenantId, fromWalletId, session.user.email);

  if (!fromAccess.ok) {
    return fromAccess.error;
  }

  const toAccess = await requireWalletWriteAccess(tenantId, toWalletId, session.user.email);

  if (!toAccess.ok) {
    return toAccess.error;
  }

  const fromWallet = fromAccess.wallet;
  const toWallet = toAccess.wallet;

  if (fromWallet.currency !== toWallet.currency) {
    return apiError('TRANSFER_CURRENCY_MISMATCH', 400);
  }

  const description = buildTransferDescription(fromWallet.name, toWallet.name, note);
  const now = new Date();
  // Matches the add-transaction default rule: current instant unless the user picks a date,
  // to keep intraday ordering consistent with backfilled rows.
  const occurredAt = body.occurredAt ? calendarDateToOccurredAtStart(fromWallet.timezone, body.occurredAt) : now;

  await db.transaction().execute(async (trx) => {
    await transferBetweenWallets(trx, {
      actor: { userId: session.user.id, email: session.user.email },
      fromWalletId,
      fromTenantId: fromWallet.tenantId,
      toWalletId,
      toTenantId: toWallet.tenantId,
      amount,
      description,
      occurredAt,
    });
  });

  return Response.json({ success: true }, { status: 201 });
};

export const config: Config = {
  path: '/api/wallets/transfer',
};
