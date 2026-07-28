import type { Config, Context } from '@netlify/functions';

import { FILTER_OPTIONS } from '#/constants/filter-options.ts';
import { DEFAULT_SORT_BY, DEFAULT_SORT_ORDER, SORT_BY_OPTIONS, SORT_ORDER_OPTIONS } from '#/constants/sort-options.ts';
import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import type { TransactionType } from '#/lib/db/schema.ts';
import { calendarDateToOccurredAtStart, resolvePeriodBounds } from '#/lib/period-bounds.ts';

import { getTenantId, requireWalletAccess, requireWalletWriteAccess } from './lib/tenant-access.ts';
import { createTransaction } from './lib/wallet-mutations.ts';

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === 'string' && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/transactions$/);

  return match?.[1] ?? null;
}

type AddTransactionBody = {
  type?: unknown;
  amount?: unknown;
  description?: unknown;
  occurredAt?: unknown;
};

function isValidSortBy(
  value: string | null,
): value is
  | typeof SORT_BY_OPTIONS.CREATED_AT
  | typeof SORT_BY_OPTIONS.UPDATED_AT
  | typeof SORT_BY_OPTIONS.AMOUNT
  | typeof SORT_BY_OPTIONS.OCCURRED_AT {
  return (
    value === SORT_BY_OPTIONS.CREATED_AT ||
    value === SORT_BY_OPTIONS.UPDATED_AT ||
    value === SORT_BY_OPTIONS.AMOUNT ||
    value === SORT_BY_OPTIONS.OCCURRED_AT
  );
}

function isValidSortOrder(
  value: string | null,
): value is typeof SORT_ORDER_OPTIONS.ASC | typeof SORT_ORDER_OPTIONS.DESC {
  return value === SORT_ORDER_OPTIONS.ASC || value === SORT_ORDER_OPTIONS.DESC;
}

function isValidTransactionType(value: unknown): value is TransactionType {
  return value === 'income' || value === 'expense';
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return new Response('Wallet id is required', { status: 400 });
  }

  const tenantId = getTenantId(session);

  if (request.method === 'POST') {
    const body = (await request.json()) as AddTransactionBody;

    if (!isValidTransactionType(body.type)) {
      return new Response('Transaction type must be income or expense', { status: 400 });
    }

    if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
      return new Response('Amount must be greater than 0', { status: 400 });
    }

    if (typeof body.description !== 'string' || body.description.trim().length === 0) {
      return new Response('Description is required', { status: 400 });
    }

    if (body.occurredAt !== undefined && typeof body.occurredAt !== 'string') {
      return new Response('Occurred at must be a date string', { status: 400 });
    }

    const type = body.type;
    const amount = body.amount;
    const description = body.description.trim();

    const access = await requireWalletWriteAccess(tenantId, walletId, session.user.email);

    if (!access.ok) {
      return access.error;
    }

    const { wallet } = access;
    const now = new Date();
    // No explicit date: default to the current instant, not start-of-day. Backfilled rows
    // keep real intraday `created_at` times, so a start-of-day default for new rows would
    // make same-day ordering inconsistent between old and new transactions.
    const occurredAt = body.occurredAt ? calendarDateToOccurredAtStart(wallet.timezone, body.occurredAt) : now;

    await db.transaction().execute(async (trx) => {
      await createTransaction(trx, {
        walletId,
        tenantId: wallet.tenantId,
        actor: { userId: session.user.id, email: session.user.email },
        type,
        amount,
        description,
        occurredAt,
      });
    });

    return Response.json({ success: true }, { status: 201 });
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '10', 10) || 10));
    const offset = (page - 1) * pageSize;
    const filter = url.searchParams.get('filter') ?? FILTER_OPTIONS.ALL_TIME;
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const sortByParam = url.searchParams.get('sortBy');
    const sortOrderParam = url.searchParams.get('sortOrder');
    const sortBy = isValidSortBy(sortByParam) ? sortByParam : DEFAULT_SORT_BY;
    const sortOrder = isValidSortOrder(sortOrderParam) ? sortOrderParam : DEFAULT_SORT_ORDER;

    const access = await requireWalletAccess(tenantId, walletId, session.user.email);

    if (!access.ok) {
      return access.error;
    }

    const bounds = resolvePeriodBounds(access.wallet.timezone, filter, from ?? undefined, to ?? undefined);

    let itemsQuery = db
      .selectFrom('transaction')
      .select(['id', 'walletId', 'type', 'amount', 'description', 'occurredAt', 'createdAt', 'updatedAt'])
      .where('walletId', '=', walletId)
      .where('deletedAt', 'is', null);

    let countQuery = db
      .selectFrom('transaction')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('walletId', '=', walletId)
      .where('deletedAt', 'is', null);

    if (bounds) {
      itemsQuery = itemsQuery.where('occurredAt', '>=', bounds.start).where('occurredAt', '<', bounds.endExclusive);
      countQuery = countQuery.where('occurredAt', '>=', bounds.start).where('occurredAt', '<', bounds.endExclusive);
    }

    const [items, countResult] = await Promise.all([
      itemsQuery.orderBy(sortBy, sortOrder).limit(pageSize).offset(offset).execute(),
      countQuery.executeTakeFirst(),
    ]);

    return Response.json({
      items,
      total: Number(countResult?.count ?? 0),
      page,
      pageSize,
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
};

export const config: Config = {
  path: '/api/wallets/:walletId/transactions',
};
