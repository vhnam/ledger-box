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

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

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
};

export const config: Config = {
  path: "/api/wallets/:walletId/transactions",
};
