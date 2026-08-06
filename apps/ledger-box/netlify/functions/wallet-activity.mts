import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';

import { activityAffectsActiveShare } from './lib/activity-statement-overlap.ts';
import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === 'string' && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/activity$/);

  return match?.[1] ?? null;
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  if (request.method !== 'GET') {
    return ApiErrors.methodNotAllowed();
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20));
  const offset = (page - 1) * pageSize;

  const [rows, countResult, shares] = await Promise.all([
    db
      .selectFrom('walletActivityLog')
      .select([
        'id',
        'actorUserId',
        'actorEmail',
        'entityType',
        'entityId',
        'action',
        'beforeJson',
        'afterJson',
        'walletAmountDelta',
        'createdAt',
      ])
      .where('walletId', '=', walletId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .offset(offset)
      .execute(),
    db
      .selectFrom('walletActivityLog')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('walletId', '=', walletId)
      .executeTakeFirst(),
    db
      .selectFrom('walletStatementShare')
      .select(['periodFrom', 'periodTo', 'snapshotAt', 'revokedAt', 'expiresAt'])
      .where('walletId', '=', walletId)
      .execute(),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    actorUserId: row.actorUserId,
    actorEmail: row.actorEmail,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    before: row.beforeJson,
    after: row.afterJson,
    walletAmountDelta: row.walletAmountDelta,
    createdAt: row.createdAt,
    affectsActiveStatementShare: activityAffectsActiveShare(row, shares, ownership.wallet.timezone),
  }));

  return Response.json({
    items,
    total: Number(countResult?.count ?? 0),
    page,
    pageSize,
  });
};

export const config: Config = {
  path: '/api/wallets/:walletId/activity',
};
