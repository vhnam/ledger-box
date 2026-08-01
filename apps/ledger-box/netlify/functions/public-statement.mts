import type { Config, Context } from '@netlify/functions';

import { db } from '#/lib/db/index.ts';
import { hashShareToken } from '#/lib/share-token.ts';
import { buildStatementCsvFilename, encodeStatementCsv } from '#/lib/statement-export.ts';
import type { StatementSnapshot } from '#/lib/statement.ts';

const RATE_WINDOW_MS = 60_000;
const RATE_WINDOW_LIMIT = 60;

function getToken(request: Request, context: Context): string | null {
  const paramToken = context.params?.token;

  if (typeof paramToken === 'string' && paramToken.length > 0) {
    return paramToken;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/public\/statements\/([^/]+)$/);

  return match?.[1] ?? null;
}

export default async (request: Request, context: Context) => {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const token = getToken(request, context);

  if (!token) {
    return new Response('This link is not valid.', { status: 404 });
  }

  const tokenHash = await hashShareToken(token);

  const share = await db
    .selectFrom('walletStatementShare')
    .select([
      'id',
      'walletId',
      'revokedAt',
      'expiresAt',
      'displayTitle',
      'snapshotJson',
      'rateWindowStart',
      'rateWindowCount',
    ])
    .where('tokenHash', '=', tokenHash)
    .executeTakeFirst();

  if (!share) {
    return new Response('This link is not valid.', { status: 404 });
  }

  if (share.revokedAt) {
    return new Response('This link has been revoked.', { status: 410 });
  }

  if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
    return new Response('This link has expired.', { status: 410 });
  }

  const wallet = await db
    .selectFrom('wallet')
    .select(['deletedAt'])
    .where('id', '=', share.walletId)
    .executeTakeFirst();

  if (!wallet || wallet.deletedAt) {
    return new Response('This statement is no longer available.', { status: 410 });
  }

  const now = Date.now();
  const windowStart = share.rateWindowStart ? new Date(share.rateWindowStart).getTime() : null;
  const withinWindow = windowStart !== null && now - windowStart < RATE_WINDOW_MS;

  if (withinWindow && share.rateWindowCount >= RATE_WINDOW_LIMIT) {
    return new Response('Too many requests. Please try again shortly.', { status: 429 });
  }

  const nextRateWindowStart = withinWindow ? new Date(windowStart) : new Date(now);
  const nextRateWindowCount = withinWindow ? share.rateWindowCount + 1 : 1;

  await db
    .updateTable('walletStatementShare')
    .set({
      accessCount: (eb) => eb('accessCount', '+', 1),
      lastAccessedAt: new Date(now),
      rateWindowStart: nextRateWindowStart,
      rateWindowCount: nextRateWindowCount,
    })
    .where('id', '=', share.id)
    .execute();

  const format = new URL(request.url).searchParams.get('format');

  if (format === 'csv') {
    const snapshot = share.snapshotJson as StatementSnapshot;
    const filename = buildStatementCsvFilename(snapshot, share.displayTitle ?? 'statement');

    return new Response(encodeStatementCsv(snapshot, share.displayTitle), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  return Response.json({
    displayTitle: share.displayTitle,
    snapshot: share.snapshotJson,
  });
};

export const config: Config = {
  path: '/api/public/statements/:token',
};
