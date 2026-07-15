import type { Config, Context } from "@netlify/functions";

import { endOfDay, getLastMonthRange, getThisMonthRange, getTodayRange, parseISO, startOfDay } from "@vhnam/utils/date";

import { FILTER_OPTIONS } from "../../src/constants/filter-options.ts";
import {
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
} from "../../src/constants/sort-options.ts";
import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";
import type { TransactionType } from "../../src/lib/db/schema.ts";

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === "string" && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/transactions$/);

  return match?.[1] ?? null;
}

type DateRange = {
  start: Date;
  end: Date;
};

type AddTransactionBody = {
  type?: unknown;
  amount?: unknown;
  description?: unknown;
};

function getFilterDateRange(filter: string, from: string | null, to: string | null): DateRange | null {
  switch (filter) {
    case FILTER_OPTIONS.TODAY:
      return getTodayRange();
    case FILTER_OPTIONS.THIS_MONTH:
      return getThisMonthRange();
    case FILTER_OPTIONS.LAST_MONTH:
      return getLastMonthRange();
    case FILTER_OPTIONS.DATE_RANGE: {
      if (!from || !to) {
        return null;
      }

      return {
        start: startOfDay(parseISO(from)),
        end: endOfDay(parseISO(to)),
      };
    }
    default:
      return null;
  }
}

function isValidSortBy(
  value: string | null,
): value is typeof SORT_BY_OPTIONS.UPDATED_AT | typeof SORT_BY_OPTIONS.AMOUNT {
  return value === SORT_BY_OPTIONS.UPDATED_AT || value === SORT_BY_OPTIONS.AMOUNT;
}

function isValidSortOrder(
  value: string | null,
): value is typeof SORT_ORDER_OPTIONS.ASC | typeof SORT_ORDER_OPTIONS.DESC {
  return value === SORT_ORDER_OPTIONS.ASC || value === SORT_ORDER_OPTIONS.DESC;
}

function isValidTransactionType(value: unknown): value is TransactionType {
  return value === "income" || value === "expense";
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as AddTransactionBody;

    if (!isValidTransactionType(body.type)) {
      return new Response("Transaction type must be income or expense", { status: 400 });
    }

    if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
      return new Response("Amount must be greater than 0", { status: 400 });
    }

    if (typeof body.description !== "string" || body.description.trim().length === 0) {
      return new Response("Description is required", { status: 400 });
    }

    const type = body.type;
    const amount = body.amount;
    const description = body.description.trim();

    const wallet = await db
      .selectFrom("wallet")
      .select(["id", "amount"])
      .where("id", "=", walletId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    if (!wallet) {
      return new Response("Wallet not found", { status: 404 });
    }

    const now = new Date();
    const nextWalletAmount = type === "income" ? wallet.amount + amount : wallet.amount - amount;

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("transaction")
        .values({
          walletId,
          type,
          amount,
          description,
          createdAt: now,
          updatedAt: now,
        })
        .execute();

      await trx
        .updateTable("wallet")
        .set({
          amount: nextWalletAmount,
          updatedAt: now,
        })
        .where("id", "=", walletId)
        .execute();
    });

    return Response.json({ success: true }, { status: 201 });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "10", 10) || 10));
    const offset = (page - 1) * pageSize;
    const filter = url.searchParams.get("filter") ?? FILTER_OPTIONS.ALL_TIME;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const sortByParam = url.searchParams.get("sortBy");
    const sortOrderParam = url.searchParams.get("sortOrder");
    const sortBy = isValidSortBy(sortByParam) ? sortByParam : DEFAULT_SORT_BY;
    const sortOrder = isValidSortOrder(sortOrderParam) ? sortOrderParam : DEFAULT_SORT_ORDER;
    const dateRange = getFilterDateRange(filter, from, to);

    const wallet = await db
      .selectFrom("wallet")
      .select("id")
      .where("id", "=", walletId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    if (!wallet) {
      return new Response("Wallet not found", { status: 404 });
    }

    let itemsQuery = db
      .selectFrom("transaction")
      .select(["id", "walletId", "type", "amount", "description", "createdAt", "updatedAt"])
      .where("walletId", "=", walletId)
      .where("deletedAt", "is", null);

    let countQuery = db
      .selectFrom("transaction")
      .select((eb) => eb.fn.count("id").as("count"))
      .where("walletId", "=", walletId)
      .where("deletedAt", "is", null);

    if (dateRange) {
      itemsQuery = itemsQuery.where("updatedAt", ">=", dateRange.start).where("updatedAt", "<=", dateRange.end);
      countQuery = countQuery.where("updatedAt", ">=", dateRange.start).where("updatedAt", "<=", dateRange.end);
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

  return new Response("Method Not Allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/wallets/:walletId/transactions",
};
