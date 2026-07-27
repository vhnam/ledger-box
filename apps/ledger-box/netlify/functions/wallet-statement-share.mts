import type { Config, Context } from "@netlify/functions";

import { auth } from "#/lib/auth.ts";
import { db } from "#/lib/db/index.ts";

import { getTenantId, requireOwnedWallet } from "./lib/tenant-access.ts";

function getIds(request: Request, context: Context): { walletId: string | null; shareId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramShareId = context.params?.shareId;

  if (
    typeof paramWalletId === "string" &&
    paramWalletId.length > 0 &&
    typeof paramShareId === "string" &&
    paramShareId.length > 0
  ) {
    return { walletId: paramWalletId, shareId: paramShareId };
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/statement-shares\/([^/]+)$/);

  return {
    walletId: match?.[1] ?? null,
    shareId: match?.[2] ?? null,
  };
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { walletId, shareId } = getIds(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

  if (!shareId) {
    return new Response("Share id is required", { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const existingShare = await db
    .selectFrom("walletStatementShare")
    .select(["id"])
    .where("id", "=", shareId)
    .where("walletId", "=", walletId)
    .executeTakeFirst();

  if (!existingShare) {
    return new Response("Share not found", { status: 404 });
  }

  await db
    .updateTable("walletStatementShare")
    .set({ revokedAt: new Date() })
    .where("id", "=", shareId)
    .where("walletId", "=", walletId)
    .execute();

  return Response.json({ success: true });
};

export const config: Config = {
  path: "/api/wallets/:walletId/statement-shares/:shareId",
};
