import type { Config, Context } from "@netlify/functions";

import { auth } from "#/lib/auth.ts";
import { db } from "#/lib/db/index.ts";
import { calendarDateToOccurredAtStart } from "#/lib/period-bounds.ts";
import { generateShareToken } from "#/lib/share-token.ts";
import { buildStatement } from "#/lib/statement.ts";

import { getTenantId, requireOwnedWallet } from "./lib/tenant-access.ts";

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

  if (typeof paramWalletId === "string" && paramWalletId.length > 0) {
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
    return new Response("Unauthorized", { status: 401 });
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

  const { wallet } = ownership;

  if (request.method === "GET") {
    const shares = await db
      .selectFrom("walletStatementShare")
      .select([
        "id",
        "periodFrom",
        "periodTo",
        "displayTitle",
        "expiresAt",
        "revokedAt",
        "snapshotAt",
        "accessCount",
        "lastAccessedAt",
      ])
      .where("walletId", "=", walletId)
      .orderBy("createdAt", "desc")
      .execute();

    return Response.json({
      items: shares.map((share) => ({
        ...share,
        isActive: isActive(share),
      })),
    });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as CreateStatementShareBody;

    if (typeof body.periodFrom !== "string" || body.periodFrom.length === 0) {
      return new Response("Period start is required", { status: 400 });
    }

    if (typeof body.periodTo !== "string" || body.periodTo.length === 0) {
      return new Response("Period end is required", { status: 400 });
    }

    if (body.displayTitle !== undefined && typeof body.displayTitle !== "string") {
      return new Response("Display title must be a string", { status: 400 });
    }

    if (typeof body.displayTitle === "string" && body.displayTitle.length > MAX_DISPLAY_TITLE_LENGTH) {
      return new Response(`Display title must be ${MAX_DISPLAY_TITLE_LENGTH} characters or fewer`, { status: 400 });
    }

    if (body.expiresAt !== undefined && body.expiresAt !== null && typeof body.expiresAt !== "string") {
      return new Response("Expiry must be a date string or null", { status: 400 });
    }

    const periodFrom = body.periodFrom;
    const periodTo = body.periodTo;
    const displayTitle = typeof body.displayTitle === "string" ? body.displayTitle.trim() || null : null;

    const bounds = {
      start: calendarDateToOccurredAtStart(wallet.timezone, periodFrom),
      endExclusive: new Date(calendarDateToOccurredAtStart(wallet.timezone, periodTo).getTime() + 24 * 60 * 60 * 1000),
    };

    const snapshot = await buildStatement(db, walletId, bounds, wallet.timezone);

    const url = new URL(request.url);

    if (url.searchParams.get("preview") === "true") {
      return Response.json({ preview: snapshot });
    }

    // explicit `null` means the owner opted into no expiry; omitted means the 90-day default.
    const expiresAt =
      body.expiresAt === undefined ? defaultExpiresAt() : body.expiresAt ? new Date(body.expiresAt) : null;

    const { raw, hash } = await generateShareToken();

    const share = await db
      .insertInto("walletStatementShare")
      .values({
        walletId,
        tenantId,
        periodFrom,
        periodTo,
        tokenHash: hash,
        displayTitle,
        expiresAt,
        snapshotJson: snapshot,
        snapshotAt: new Date(),
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    return Response.json(
      {
        shareId: share.id,
        token: raw,
        publicUrl: `/statement/${raw}`,
      },
      { status: 201 },
    );
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/wallets/:walletId/statement-shares",
};
