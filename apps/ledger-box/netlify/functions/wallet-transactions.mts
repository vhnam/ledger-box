import type { Config, Context } from "@netlify/functions";

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

  const wallet = await db.selectFrom("wallet").select("id").where("id", "=", walletId).executeTakeFirst();

  if (!wallet) {
    return new Response("Wallet not found", { status: 404 });
  }

  const [items, countResult] = await Promise.all([
    db
      .selectFrom("transaction")
      .select(["id", "walletId", "type", "amount", "description", "datetime"])
      .where("walletId", "=", walletId)
      .orderBy("datetime", "desc")
      .limit(pageSize)
      .offset(offset)
      .execute(),
    db
      .selectFrom("transaction")
      .select((eb) => eb.fn.count("id").as("count"))
      .where("walletId", "=", walletId)
      .executeTakeFirst(),
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
