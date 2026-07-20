import type { Config, Context } from "@netlify/functions";

import { auth } from "../../src/lib/auth.ts";
import { db } from "../../src/lib/db/index.ts";
import { listTransactionAttachments, uploadTransactionAttachment } from "../../src/lib/r2.ts";

const ACCEPTED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

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

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/transactions\/([^/]+)\/attachments$/);

  return {
    walletId: match?.[1] ?? null,
    transactionId: match?.[2] ?? null,
  };
}

function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? "file";
  const sanitized = baseName.replace(/[^\w.\-() ]/g, "_").trim();

  return sanitized.length > 0 ? sanitized.slice(0, 255) : "file";
}

function isAcceptedAttachment(file: File): boolean {
  return ACCEPTED_ATTACHMENT_TYPES.has(file.type);
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

  const { walletId, transactionId } = getIds(request, context);

  if (!walletId) {
    return new Response("Wallet id is required", { status: 400 });
  }

  if (!transactionId) {
    return new Response("Transaction id is required", { status: 400 });
  }

  const verificationError = await verifyTransaction(walletId, transactionId);

  if (verificationError) {
    return verificationError;
  }

  if (request.method === "GET") {
    try {
      const attachments = await listTransactionAttachments(transactionId);

      return Response.json({ attachments });
    } catch (error) {
      console.error("Failed to list transaction attachments", error);

      return new Response("Failed to load attachments", { status: 500 });
    }
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return new Response("Invalid multipart form data", { status: 400 });
  }

  const files = [...formData.getAll("file"), ...formData.getAll("files")].filter(
    (value): value is File => value instanceof File,
  );

  if (files.length === 0) {
    return new Response("At least one file is required", { status: 400 });
  }

  const uploads = [];

  for (const file of files) {
    if (!isAcceptedAttachment(file)) {
      return new Response("Only PDF, PNG, JPG, JPEG, and WEBP files are supported", { status: 400 });
    }

    if (file.size <= 0) {
      return new Response("File must not be empty", { status: 400 });
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return new Response("File size must be 10 MB or less", { status: 400 });
    }

    const attachmentId = crypto.randomUUID();
    const fileName = sanitizeFileName(file.name);
    const body = new Uint8Array(await file.arrayBuffer());

    uploads.push(
      uploadTransactionAttachment({
        transactionId,
        attachmentId,
        fileName,
        contentType: file.type,
        body,
      }),
    );
  }

  try {
    const attachments = await Promise.all(uploads);

    return Response.json(
      {
        attachments,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload transaction attachment", error);

    return new Response("Failed to upload attachment", { status: 500 });
  }
};

export const config: Config = {
  path: "/api/wallets/:walletId/transactions/:transactionId/attachments",
};
