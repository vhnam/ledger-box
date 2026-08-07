import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth/auth.ts';
import { db } from '#/lib/db/index.ts';
import { buildStatement } from '#/lib/wallet/statement.ts';
import { calendarDateToOccurredAtStart } from '#/utils/wallet/period-bounds.ts';
import { generateShareToken } from '#/utils/wallet/share-token.ts';
import { buildStatementCsvFilename, encodeStatementCsv } from '#/utils/wallet/statement-export.ts';

import { recordActivity } from './lib/activity-log.ts';
import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';

const DEFAULT_EXPIRY_DAYS = 90;
const MAX_DISPLAY_TITLE_LENGTH = 80;

type CreateStatementShareBody = {
  periodFrom?: unknown;
  periodTo?: unknown;
  displayTitle?: unknown;
  expiresAt?: unknown;
};

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === 'string' && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/statement-shares$/);

  return match?.[1] ?? null;
}

function isActive(share: { revokedAt: Date | string | null; expiresAt: Date | string | null }): boolean {
  if (share.revokedAt) {
    return false;
  }

  if (!share.expiresAt) {
    return true;
  }

  return new Date(share.expiresAt).getTime() > Date.now();
}

function defaultExpiresAt(): Date {
  return new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
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

  const { wallet } = ownership;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20));
    const offset = (page - 1) * pageSize;

    const [shares, countResult] = await Promise.all([
      db
        .selectFrom('walletStatementShare')
        .select([
          'id',
          'periodFrom',
          'periodTo',
          'displayTitle',
          'expiresAt',
          'revokedAt',
          'snapshotAt',
          'accessCount',
          'lastAccessedAt',
        ])
        .where('walletId', '=', walletId)
        .orderBy('createdAt', 'desc')
        .limit(pageSize)
        .offset(offset)
        .execute(),
      db
        .selectFrom('walletStatementShare')
        .select((eb) => eb.fn.count('id').as('count'))
        .where('walletId', '=', walletId)
        .executeTakeFirst(),
    ]);

    return Response.json({
      items: shares.map((share) => ({
        ...share,
        isActive: isActive(share),
      })),
      total: Number(countResult?.count ?? 0),
      page,
      pageSize,
    });
  }

  if (request.method === 'POST') {
    const body = (await request.json()) as CreateStatementShareBody;

    if (typeof body.periodFrom !== 'string' || body.periodFrom.length === 0) {
      return apiError('PERIOD_START_REQUIRED', 400);
    }

    if (typeof body.periodTo !== 'string' || body.periodTo.length === 0) {
      return apiError('PERIOD_END_REQUIRED', 400);
    }

    if (body.displayTitle !== undefined && typeof body.displayTitle !== 'string') {
      return apiError('DISPLAY_TITLE_TYPE_INVALID', 400);
    }

    if (typeof body.displayTitle === 'string' && body.displayTitle.length > MAX_DISPLAY_TITLE_LENGTH) {
      return apiError('DISPLAY_TITLE_TOO_LONG', 400);
    }

    if (body.expiresAt !== undefined && body.expiresAt !== null && typeof body.expiresAt !== 'string') {
      return apiError('EXPIRY_INVALID', 400);
    }

    const periodFrom = body.periodFrom;
    const periodTo = body.periodTo;
    const displayTitle = typeof body.displayTitle === 'string' ? body.displayTitle.trim() || null : null;

    const bounds = {
      start: calendarDateToOccurredAtStart(wallet.timezone, periodFrom),
      endExclusive: new Date(calendarDateToOccurredAtStart(wallet.timezone, periodTo).getTime() + 24 * 60 * 60 * 1000),
    };

    const snapshot = await buildStatement(db, walletId, bounds, wallet.timezone);

    const url = new URL(request.url);

    if (url.searchParams.get('preview') === 'true') {
      if (url.searchParams.get('format') === 'csv') {
        const filename = buildStatementCsvFilename(snapshot, wallet.name);

        return new Response(encodeStatementCsv(snapshot, displayTitle), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      return Response.json({ preview: snapshot });
    }

    // explicit `null` means the owner opted into no expiry; omitted means the 90-day default.
    const expiresAt =
      body.expiresAt === undefined ? defaultExpiresAt() : body.expiresAt ? new Date(body.expiresAt) : null;

    const { raw, hash } = await generateShareToken();
    const snapshotAt = new Date();
    const actor = { userId: session.user.id, email: session.user.email };

    const share = await db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('walletStatementShare')
        .values({
          walletId,
          tenantId,
          periodFrom,
          periodTo,
          tokenHash: hash,
          displayTitle,
          expiresAt,
          snapshotJson: snapshot,
          snapshotAt,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      await recordActivity(trx, {
        walletId,
        tenantId: wallet.tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'statement_share',
        entityId: created.id,
        action: 'create',
        before: null,
        after: {
          periodFrom,
          periodTo,
          displayTitle,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          snapshotAt: snapshotAt.toISOString(),
        },
      });

      return created;
    });

    return Response.json(
      {
        shareId: share.id,
        token: raw,
        publicUrl: `/statement/${raw}`,
      },
      { status: 201 },
    );
  }

  return ApiErrors.methodNotAllowed();
};

export const config: Config = {
  path: '/api/wallets/:walletId/statement-shares',
};
