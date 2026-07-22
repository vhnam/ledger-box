import type { Config } from "@netlify/functions";

import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";
import { getTenantId } from "./lib/tenant-access.ts";

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tenantId = getTenantId(session);

  if (request.method === "GET") {
    const wallets = await db
      .selectFrom("wallet")
      .select(["id", "name", "amount"])
      .where("tenantId", "=", tenantId)
      .where("deletedAt", "is", null)
      .orderBy("name")
      .execute();

    return Response.json(wallets);
  }

  if (request.method === "POST") {
    const body = (await request.json()) as { name?: unknown };

    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return new Response("Wallet name is required", { status: 400 });
    }

    const wallet = await db
      .insertInto("wallet")
      .values({ name: body.name.trim(), tenantId })
      .returning(["id", "name"])
      .executeTakeFirstOrThrow();

    return Response.json(wallet, { status: 201 });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/wallets",
};
