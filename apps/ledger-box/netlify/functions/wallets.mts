import type { Config } from '@netlify/functions';

import { auth } from '#/lib/auth/auth.ts';
import { db } from '#/lib/db/index.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { isAllowedCurrency } from './lib/currency.ts';
import { findAccessibleWallets, getTenantId } from './lib/tenant-access.ts';

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  const tenantId = getTenantId(session);

  if (request.method === 'GET') {
    const wallets = await findAccessibleWallets(tenantId, session.user.email);

    return Response.json(
      wallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        amount: wallet.amount,
        currency: wallet.currency,
        role: wallet.role,
      })),
    );
  }

  if (request.method === 'POST') {
    const body = (await request.json()) as { name?: unknown; currency?: unknown };

    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return apiError('WALLET_NAME_REQUIRED', 400);
    }

    if (body.currency !== undefined && !isAllowedCurrency(body.currency)) {
      return apiError('UNSUPPORTED_CURRENCY', 400);
    }

    const currency = isAllowedCurrency(body.currency) ? body.currency : 'VND';

    const wallet = await db
      .insertInto('wallet')
      .values({ name: body.name.trim(), tenantId, amount: 0, currency, createdAt: new Date(), updatedAt: new Date() })
      .returning(['id', 'name', 'currency'])
      .executeTakeFirstOrThrow();

    return Response.json({ ...wallet, amount: 0, role: 'owner' as const }, { status: 201 });
  }

  return ApiErrors.methodNotAllowed();
};

export const config: Config = {
  path: '/api/wallets',
};
