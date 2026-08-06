import type { Config, Context } from '@netlify/functions';

import { FILTER_OPTIONS } from '#/constants/filter-options.ts';
import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import { resolvePeriodBounds } from '#/lib/period-bounds.ts';
import { computeWalletSummary } from '#/lib/wallet-summary.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { requireWalletAccess } from './lib/tenant-access.ts';

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === 'string' && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/summary$/);

  return match?.[1] ?? null;
}

export default async (request: Request, context: Context) => {
  if (request.method !== 'GET') {
    return ApiErrors.methodNotAllowed();
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  const tenantId = session.user.id;
  const access = await requireWalletAccess(tenantId, walletId, session.user.email);

  if (!access.ok) {
    return access.error;
  }

  const url = new URL(request.url);
  const filter = url.searchParams.get('filter') ?? FILTER_OPTIONS.ALL_TIME;
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const bounds = resolvePeriodBounds(access.wallet.timezone, filter, from ?? undefined, to ?? undefined);

  const summary = await computeWalletSummary(db, walletId, bounds);

  return Response.json(summary);
};

export const config: Config = {
  path: '/api/wallets/:walletId/summary',
};
