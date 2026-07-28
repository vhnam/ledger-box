import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';

import { recordActivity } from './lib/activity-log.ts';
import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';

function getIds(request: Request, context: Context): { walletId: string | null; shareId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramShareId = context.params?.shareId;

  if (
    typeof paramWalletId === 'string' &&
    paramWalletId.length > 0 &&
    typeof paramShareId === 'string' &&
    paramShareId.length > 0
  ) {
    return { walletId: paramWalletId, shareId: paramShareId };
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/statement-shares\/([^/]+)$/);

  return {
    walletId: match?.[1] ?? null,
    shareId: match?.[2] ?? null,
  };
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (request.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { walletId, shareId } = getIds(request, context);

  if (!walletId) {
    return new Response('Wallet id is required', { status: 400 });
  }

  if (!shareId) {
    return new Response('Share id is required', { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const existingShare = await db
    .selectFrom('walletStatementShare')
    .select(['id', 'periodFrom', 'periodTo', 'displayTitle', 'expiresAt', 'snapshotAt'])
    .where('id', '=', shareId)
    .where('walletId', '=', walletId)
    .executeTakeFirst();

  if (!existingShare) {
    return new Response('Share not found', { status: 404 });
  }

  const revokedAt = new Date();
  const actor = { userId: session.user.id, email: session.user.email };

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('walletStatementShare')
      .set({ revokedAt })
      .where('id', '=', shareId)
      .where('walletId', '=', walletId)
      .execute();

    await recordActivity(trx, {
      walletId,
      tenantId: ownership.wallet.tenantId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      entityType: 'statement_share',
      entityId: shareId,
      action: 'revoke',
      before: {
        shareId: existingShare.id,
        periodFrom: existingShare.periodFrom,
        periodTo: existingShare.periodTo,
        displayTitle: existingShare.displayTitle,
        expiresAt: existingShare.expiresAt,
        snapshotAt: existingShare.snapshotAt,
      },
      after: { revokedAt: revokedAt.toISOString() },
    });
  });

  return Response.json({ success: true });
};

export const config: Config = {
  path: '/api/wallets/:walletId/statement-shares/:shareId',
};
