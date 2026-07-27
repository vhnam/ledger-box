import type { Config } from '@netlify/functions';
import { sql } from 'kysely';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import { calendarDateToOccurredAtStart } from '#/lib/period-bounds.ts';

import { getTenantId, requireWalletWriteAccess } from './lib/tenant-access.ts';

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
    return new Response('Unauthorized', { status: 401 });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const tenantId = getTenantId(session);
  const body = (await request.json()) as TransferMoneyBody;

  if (typeof body.fromWalletId !== 'string' || body.fromWalletId.trim().length === 0) {
    return new Response('Source wallet is required', { status: 400 });
  }

  if (typeof body.toWalletId !== 'string' || body.toWalletId.trim().length === 0) {
    return new Response('Destination wallet is required', { status: 400 });
  }

  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
    return new Response('Amount must be greater than 0', { status: 400 });
  }

  if (typeof body.note !== 'string' || body.note.trim().length === 0) {
    return new Response('Note is required', { status: 400 });
  }

  if (body.occurredAt !== undefined && typeof body.occurredAt !== 'string') {
    return new Response('Occurred at must be a date string', { status: 400 });
  }

  const fromWalletId = body.fromWalletId.trim();
  const toWalletId = body.toWalletId.trim();
  const amount = body.amount;
  const note = body.note.trim();

  if (fromWalletId === toWalletId) {
    return new Response('Source and destination wallets must be different', { status: 400 });
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

  const description = buildTransferDescription(fromWallet.name, toWallet.name, note);
  const now = new Date();
  // Matches the add-transaction default rule: current instant unless the user picks a date,
  // to keep intraday ordering consistent with backfilled rows.
  const occurredAt = body.occurredAt ? calendarDateToOccurredAtStart(fromWallet.timezone, body.occurredAt) : now;

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('transaction')
      .values({
        walletId: fromWalletId,
        type: 'expense',
        amount,
        description,
        occurredAt,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    await trx
      .insertInto('transaction')
      .values({
        walletId: toWalletId,
        type: 'income',
        amount,
        description,
        occurredAt,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    await trx
      .updateTable('wallet')
      .set({
        amount: sql`amount - ${amount}`,
        updatedAt: now,
      })
      .where('id', '=', fromWalletId)
      .execute();

    await trx
      .updateTable('wallet')
      .set({
        amount: sql`amount + ${amount}`,
        updatedAt: now,
      })
      .where('id', '=', toWalletId)
      .execute();
  });

  return Response.json({ success: true }, { status: 201 });
};

export const config: Config = {
  path: '/api/wallets/transfer',
};
