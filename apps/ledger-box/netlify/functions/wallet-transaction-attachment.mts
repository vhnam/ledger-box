import type { Config, Context } from "@netlify/functions";

import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";
import { deleteTransactionAttachment } from "../../src/lib/r2.ts";

function getIds(
  request: Request,
  context: Context,
): { walletId: string | null; transactionId: string | null; attachmentId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramTransactionId = context.params?.transactionId;
  const paramAttachmentId = context.params?.attachmentId;

  if (
    typeof paramWalletId === "string" &&
    paramWalletId.length > 0 &&
    typeof paramTransactionId === "string" &&
    paramTransactionId.length > 0 &&
    typeof paramAttachmentId === "string" &&
    paramAttachmentId.length > 0
  ) {
    return {
      walletId: paramWalletId,
      transactionId: paramTransactionId,
      attachmentId: paramAttachmentId,
    };
  }

  const match = new URL(request.url).pathname.match(
    /^\/api\/wallets\/([^/]+)\/transactions\/([^/]+)\/attachments\/([^/]+)$/,
  );

  return {
    walletId: match?.[1] ?? null,
    transactionId: match?.[2] ?? null,
    attachmentId: match?.[3] ?? null,
  };
}

async function verifyTransaction(walletId: string, transactionId: string) {
  const wallet = await db
    .selectFrom("wallet")
    .select("id")
    .where("id", "=", walletId)
    .where("deletedAt", "is", null)
    .executeTakeFirst();

  if (!wallet) {
    return new Response("Wallet not found", { status: 404 });
  }

  const transaction = await db
    .selectFrom("transaction")
    .select("id")
    .where("id", "=", transactionId)
    .where("walletId", "=", walletId)
    .where("deletedAt", "is", null)
    .executeTakeFirst();

  if (!transaction) {
    return new Response("Transaction not found", { status: 404 });
  }

  return null;
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { walletId, transactionId, attachmentId } = getIds(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

  if (!transactionId) {
    return new Response("Transaction id is required", { status: 400 });
  }

  if (!attachmentId) {
    return new Response("Attachment id is required", { status: 400 });
  }

  const verificationError = await verifyTransaction(walletId, transactionId);

  if (verificationError) {
    return verificationError;
  }

  try {
    const deleted = await deleteTransactionAttachment(transactionId, attachmentId);

    if (!deleted) {
      return new Response("Attachment not found", { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transaction attachment", error);

    return new Response("Failed to delete attachment", { status: 500 });
  }
};

export const config: Config = {
  path: "/api/wallets/:walletId/transactions/:transactionId/attachments/:attachmentId",
};
