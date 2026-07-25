import type { Config, Context } from "@netlify/functions";

import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";
import { getTenantId, requireOwnedWallet } from "./lib/tenant-access.ts";

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === "string" && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)$/);

  return match?.[1] ?? null;
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "PATCH" && request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  if (request.method === "DELETE") {
    const now = new Date();

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("transaction")
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where("walletId", "=", walletId)
        .where("deletedAt", "is", null)
        .execute();

      await trx
        .updateTable("wallet")
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where("id", "=", walletId)
        .where("tenantId", "=", tenantId)
        .execute();
    });

    return Response.json({ success: true });
  }

  const body = (await request.json()) as { name?: unknown };

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return new Response("Wallet name is required", { status: 400 });
  }

  const wallet = await db
    .updateTable("wallet")
    .set({
      name: body.name.trim(),
      updatedAt: new Date(),
    })
    .where("id", "=", walletId)
    .where("tenantId", "=", tenantId)
    .where("deletedAt", "is", null)
    .returning(["id", "name", "amount"])
    .executeTakeFirstOrThrow();

  return Response.json(wallet);
};

export const config: Config = {
  path: "/api/wallets/:walletId",
};
