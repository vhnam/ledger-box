import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';

import { recordActivity } from './lib/activity-log.ts';
import { getTenantId, requireOwnedWallet, requireWalletWriteAccess } from './lib/tenant-access.ts';

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === 'string' && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)$/);

  return match?.[1] ?? null;
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (request.method !== 'PATCH' && request.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return new Response('Wallet id is required', { status: 400 });
  }

  const tenantId = getTenantId(session);
  const actor = { userId: session.user.id, email: session.user.email };

  if (request.method === 'DELETE') {
    const ownership = await requireOwnedWallet(tenantId, walletId);

    if (!ownership.ok) {
      return ownership.error;
    }

    const now = new Date();

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('transaction')
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where('walletId', '=', walletId)
        .where('deletedAt', 'is', null)
        .execute();

      await trx
        .updateTable('wallet')
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where('id', '=', walletId)
        .where('tenantId', '=', tenantId)
        .execute();

      await recordActivity(trx, {
        walletId,
        tenantId: ownership.wallet.tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'wallet',
        entityId: walletId,
        action: 'delete',
        before: { name: ownership.wallet.name },
        after: null,
      });
    });

    return Response.json({ success: true });
  }

  const access = await requireWalletWriteAccess(tenantId, walletId, session.user.email);

  if (!access.ok) {
    return access.error;
  }

  const body = (await request.json()) as { name?: unknown };

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return new Response('Wallet name is required', { status: 400 });
  }

  const previousName = access.wallet.name;
  const nextName = body.name.trim();

  const wallet = await db.transaction().execute(async (trx) => {
    const updated = await trx
      .updateTable('wallet')
      .set({
        name: nextName,
        updatedAt: new Date(),
      })
      .where('id', '=', walletId)
      .where('deletedAt', 'is', null)
      .returning(['id', 'name', 'amount'])
      .executeTakeFirstOrThrow();

    await recordActivity(trx, {
      walletId,
      tenantId: access.wallet.tenantId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      entityType: 'wallet',
      entityId: walletId,
      action: 'rename',
      before: { name: previousName },
      after: { name: nextName },
    });

    return updated;
  });

  return Response.json({ ...wallet, role: access.role });
};

export const config: Config = {
  path: '/api/wallets/:walletId',
};
