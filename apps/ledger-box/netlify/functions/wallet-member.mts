import type { Config, Context } from "@netlify/functions";

import { WALLET_MEMBER_ROLES } from "../../src/constants/wallet-member-role-options.ts";
import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";
import type { WalletMemberRole } from "../../src/lib/db/schema.ts";
import { getTenantId, requireOwnedWallet } from "./lib/tenant-access.ts";
import { findUserByEmail, findUserById } from "./lib/user-lookup.ts";
import { mapWalletMember } from "./lib/wallet-member-response.ts";

type UpdateWalletMemberBody = {
  role?: unknown;
};

function getIds(request: Request, context: Context): { walletId: string | null; memberId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramMemberId = context.params?.memberId;

  if (
    typeof paramWalletId === "string" &&
    paramWalletId.length > 0 &&
    typeof paramMemberId === "string" &&
    paramMemberId.length > 0
  ) {
    return { walletId: paramWalletId, memberId: paramMemberId };
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/members\/([^/]+)$/);

  return {
    walletId: match?.[1] ?? null,
    memberId: match?.[2] ?? null,
  };
}

function isWalletMemberRole(value: unknown): value is WalletMemberRole {
  return value === WALLET_MEMBER_ROLES.VIEWER || value === WALLET_MEMBER_ROLES.MANAGER;
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "PATCH" && request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { walletId, memberId } = getIds(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

  if (!memberId) {
    return new Response("Member id is required", { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const existingMember = await db
    .selectFrom("walletMember")
    .select(["id", "email", "userId", "role", "status"])
    .where("id", "=", memberId)
    .where("walletId", "=", walletId)
    .where("deletedAt", "is", null)
    .executeTakeFirst();

  if (!existingMember) {
    return new Response("Member not found", { status: 404 });
  }

  if (request.method === "DELETE") {
    const now = new Date();

    await db
      .updateTable("walletMember")
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where("id", "=", memberId)
      .where("walletId", "=", walletId)
      .execute();

    return Response.json({ success: true });
  }

  const body = (await request.json()) as UpdateWalletMemberBody;

  if (!isWalletMemberRole(body.role)) {
    return new Response("Role is required", { status: 400 });
  }

  const member = await db
    .updateTable("walletMember")
    .set({
      role: body.role,
      updatedAt: new Date(),
    })
    .where("id", "=", memberId)
    .where("walletId", "=", walletId)
    .where("deletedAt", "is", null)
    .returning(["id", "email", "userId", "role", "status"])
    .executeTakeFirstOrThrow();

  const user = member.userId ? await findUserById(member.userId) : await findUserByEmail(member.email.toLowerCase());

  return Response.json(mapWalletMember(member, user));
};

export const config: Config = {
  path: "/api/wallets/:walletId/members/:memberId",
};
