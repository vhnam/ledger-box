import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth/auth.ts';
import { db } from '#/lib/db/index.ts';
import { generateShareToken } from '#/utils/wallet/share-token.ts';

import { recordActivity } from './lib/activity-log.ts';
import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';

const DEFAULT_EXPIRY_DAYS = 90;

function defaultExpiresAt(): Date {
  return new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

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
    return ApiErrors.unauthorized();
  }

  if (request.method !== 'DELETE' && request.method !== 'PATCH') {
    return ApiErrors.methodNotAllowed();
  }

  const { walletId, shareId } = getIds(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  if (!shareId) {
    return apiError('SHARE_ID_REQUIRED', 400);
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const existingShare = await db
    .selectFrom('walletStatementShare')
    .select(['id', 'periodFrom', 'periodTo', 'displayTitle', 'expiresAt', 'revokedAt', 'snapshotAt'])
    .where('id', '=', shareId)
    .where('walletId', '=', walletId)
    .executeTakeFirst();

  if (!existingShare) {
    return apiError('SHARE_NOT_FOUND', 404);
  }

  const actor = { userId: session.user.id, email: session.user.email };

  if (request.method === 'PATCH') {
    if (existingShare.revokedAt) {
      return apiError('SHARE_ALREADY_REVOKED', 409);
    }

    // A regenerated link replaces the old one outright, so an already-expired share is worth
    // reviving with a fresh window; an unexpired one keeps its original expiry untouched.
    const isExpired = existingShare.expiresAt ? new Date(existingShare.expiresAt).getTime() <= Date.now() : false;
    const expiresAt = isExpired ? defaultExpiresAt() : existingShare.expiresAt;
    const { raw, hash } = await generateShareToken();

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('walletStatementShare')
        .set({ tokenHash: hash, ...(isExpired ? { expiresAt } : {}) })
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
        action: 'regenerate',
        before: { shareId: existingShare.id, expiresAt: existingShare.expiresAt },
        after: { expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null },
      });
    });

    return Response.json({
      shareId: existingShare.id,
      token: raw,
      publicUrl: `/statement/${raw}`,
    });
  }

  const revokedAt = new Date();

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
