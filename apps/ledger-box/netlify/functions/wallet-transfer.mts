import type { Config } from "@netlify/functions";

import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";

type TransferMoneyBody = {
  fromWalletId?: unknown;
  toWalletId?: unknown;
  amount?: unknown;
  note?: unknown;
};

function buildTransferDescription(fromWalletName: string, toWalletName: string, note: string): string {
  return `[${fromWalletName}] → [${toWalletName}]: ${note}`;
}

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = (await request.json()) as TransferMoneyBody;

  if (typeof body.fromWalletId !== "string" || body.fromWalletId.trim().length === 0) {
    return new Response("Source wallet is required", { status: 400 });
  }

  if (typeof body.toWalletId !== "string" || body.toWalletId.trim().length === 0) {
    return new Response("Destination wallet is required", { status: 400 });
  }

  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return new Response("Amount must be greater than 0", { status: 400 });
  }

  if (typeof body.note !== "string" || body.note.trim().length === 0) {
    return new Response("Note is required", { status: 400 });
  }

  const fromWalletId = body.fromWalletId.trim();
  const toWalletId = body.toWalletId.trim();
  const amount = body.amount;
  const note = body.note.trim();

  if (fromWalletId === toWalletId) {
    return new Response("Source and destination wallets must be different", { status: 400 });
  }

  const wallets = await db
    .selectFrom("wallet")
    .select(["id", "name", "amount"])
    .where("id", "in", [fromWalletId, toWalletId])
    .where("deletedAt", "is", null)
    .execute();

  const fromWallet = wallets.find((wallet) => wallet.id === fromWalletId);
  const toWallet = wallets.find((wallet) => wallet.id === toWalletId);

  if (!fromWallet) {
    return new Response("Source wallet not found", { status: 404 });
  }

  if (!toWallet) {
    return new Response("Destination wallet not found", { status: 404 });
  }

  if (fromWallet.amount < amount) {
    return new Response("Insufficient balance in source wallet", { status: 400 });
  }

  const description = buildTransferDescription(fromWallet.name, toWallet.name, note);
  const now = new Date();

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto("transaction")
      .values({
        walletId: fromWalletId,
        type: "expense",
        amount,
        description,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    await trx
      .insertInto("transaction")
      .values({
        walletId: toWalletId,
        type: "income",
        amount,
        description,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    await trx
      .updateTable("wallet")
      .set({
        amount: fromWallet.amount - amount,
        updatedAt: now,
      })
      .where("id", "=", fromWalletId)
      .execute();

    await trx
      .updateTable("wallet")
      .set({
        amount: toWallet.amount + amount,
        updatedAt: now,
      })
      .where("id", "=", toWalletId)
      .execute();
  });

  return Response.json({ success: true }, { status: 201 });
};

export const config: Config = {
  path: "/api/wallets/transfer",
};
