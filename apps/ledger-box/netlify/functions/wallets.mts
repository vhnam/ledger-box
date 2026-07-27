import type { Config } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';

import { findAccessibleWallets, getTenantId } from './lib/tenant-access.ts';

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tenantId = getTenantId(session);

  if (request.method === 'GET') {
    const wallets = await findAccessibleWallets(tenantId, session.user.email);

    return Response.json(wallets.map((wallet) => ({ id: wallet.id, name: wallet.name, amount: wallet.amount })));
  }

  if (request.method === 'POST') {
    const body = (await request.json()) as { name?: unknown };

    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return new Response('Wallet name is required', { status: 400 });
    }

    const wallet = await db
      .insertInto('wallet')
      .values({ name: body.name.trim(), tenantId, amount: 0, createdAt: new Date(), updatedAt: new Date() })
      .returning(['id', 'name'])
      .executeTakeFirstOrThrow();

    return Response.json(wallet, { status: 201 });
  }

  return new Response('Method Not Allowed', { status: 405 });
};

export const config: Config = {
  path: '/api/wallets',
};
