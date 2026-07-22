import type { Config, Context } from "@netlify/functions";

import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";
import type { TransactionType } from "../../src/lib/db/schema.ts";
import { getTenantId, requireOwnedTransaction } from "./lib/tenant-access.ts";

type UpdateTransactionBody = {
  type?: unknown;
  amount?: unknown;
  description?: unknown;
};

function getIds(request: Request, context: Context): { walletId: string | null; transactionId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramTransactionId = context.params?.transactionId;

  if (
    typeof paramWalletId === "string" &&
    paramWalletId.length > 0 &&
    typeof paramTransactionId === "string" &&
    paramTransactionId.length > 0
  ) {
    return { walletId: paramWalletId, transactionId: paramTransactionId };
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/transactions\/([^/]+)$/);

  return {
    walletId: match?.[1] ?? null,
    transactionId: match?.[2] ?? null,
  };
}

function isValidTransactionType(value: unknown): value is TransactionType {
  return value === "income" || value === "expense";
}

function getTransactionContribution(type: TransactionType, amount: number): number {
  return type === "income" ? amount : -amount;
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "PATCH" && request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { walletId, transactionId } = getIds(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

  if (!transactionId) {
    return new Response("Transaction id is required", { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedTransaction(tenantId, walletId, transactionId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const { wallet, transaction: existingTransaction } = ownership;

  if (request.method === "DELETE") {
    const walletDelta = -getTransactionContribution(existingTransaction.type, existingTransaction.amount);
    const now = new Date();

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("transaction")
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where("id", "=", transactionId)
        .execute();

      await trx
        .updateTable("wallet")
        .set({
          amount: wallet.amount + walletDelta,
          updatedAt: now,
        })
        .where("id", "=", walletId)
        .where("tenantId", "=", tenantId)
        .execute();
    });

    return Response.json({ success: true });
  }

  const body = (await request.json()) as UpdateTransactionBody;

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

  const walletDelta =
    getTransactionContribution(type, amount) -
    getTransactionContribution(existingTransaction.type, existingTransaction.amount);
  const now = new Date();

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("transaction")
      .set({
        type,
        amount,
        description,
        updatedAt: now,
      })
      .where("id", "=", transactionId)
      .execute();

    await trx
      .updateTable("wallet")
      .set({
        amount: wallet.amount + walletDelta,
        updatedAt: now,
      })
      .where("id", "=", walletId)
      .where("tenantId", "=", tenantId)
      .execute();
  });

  return Response.json({ success: true });
};

export const config: Config = {
  path: "/api/wallets/:walletId/transactions/:transactionId",
};
