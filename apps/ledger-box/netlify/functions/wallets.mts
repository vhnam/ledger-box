import type { Config } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';

import { isAllowedCurrency } from './lib/currency.ts';
import { findAccessibleWallets, getTenantId } from './lib/tenant-access.ts';

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
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
      return new Response('Wallet name is required', { status: 400 });
    }

    if (body.currency !== undefined && !isAllowedCurrency(body.currency)) {
      return new Response('Unsupported currency', { status: 400 });
    }

    const currency = isAllowedCurrency(body.currency) ? body.currency : 'VND';

    const wallet = await db
      .insertInto('wallet')
      .values({ name: body.name.trim(), tenantId, amount: 0, currency, createdAt: new Date(), updatedAt: new Date() })
      .returning(['id', 'name', 'currency'])
      .executeTakeFirstOrThrow();

    return Response.json({ ...wallet, amount: 0, role: 'owner' as const }, { status: 201 });
  }

  return new Response('Method Not Allowed', { status: 405 });
};

export const config: Config = {
  path: '/api/wallets',
};
