import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import { buildStatementCsvFilename, encodeStatementCsv } from '#/lib/statement-export.ts';
import type { StatementSnapshot } from '#/lib/statement.ts';

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

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/statement-shares\/([^/]+)\/export$/);

  return { walletId: match?.[1] ?? null, shareId: match?.[2] ?? null };
}

export default async (request: Request, context: Context) => {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { walletId, shareId } = getIds(request, context);

  if (!walletId || !shareId) {
    return new Response('Wallet id and share id are required', { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const { wallet } = ownership;

  const share = await db
    .selectFrom('walletStatementShare')
    .select(['id', 'displayTitle', 'snapshotJson'])
    .where('id', '=', shareId)
    .where('walletId', '=', walletId)
    .executeTakeFirst();

  if (!share) {
    return new Response('Statement share not found', { status: 404 });
  }

  const snapshot = share.snapshotJson as StatementSnapshot;
  const filename = buildStatementCsvFilename(snapshot, wallet.name);

  return new Response(encodeStatementCsv(snapshot, share.displayTitle), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};

export const config: Config = {
  path: '/api/wallets/:walletId/statement-shares/:shareId/export',
};
