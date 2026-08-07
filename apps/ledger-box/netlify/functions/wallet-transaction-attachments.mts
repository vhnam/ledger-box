import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth/auth.ts';
import { listTransactionAttachments, uploadTransactionAttachment } from '#/lib/storage/r2.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireTransactionAccess, requireTransactionWriteAccess } from './lib/tenant-access.ts';

const ACCEPTED_ATTACHMENT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

function getIds(request: Request, context: Context): { walletId: string | null; transactionId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramTransactionId = context.params?.transactionId;

  if (
    typeof paramWalletId === 'string' &&
    paramWalletId.length > 0 &&
    typeof paramTransactionId === 'string' &&
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
  const baseName = fileName.split(/[/\\]/).pop() ?? 'file';
  const sanitized = baseName.replace(/[^\w.\-() ]/g, '_').trim();

  return sanitized.length > 0 ? sanitized.slice(0, 255) : 'file';
}

function isAcceptedAttachment(file: File): boolean {
  return ACCEPTED_ATTACHMENT_TYPES.has(file.type);
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  const { walletId, transactionId } = getIds(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  if (!transactionId) {
    return apiError('TRANSACTION_ID_REQUIRED', 400);
  }

  const tenantId = getTenantId(session);

  if (request.method === 'GET') {
    const access = await requireTransactionAccess(tenantId, walletId, transactionId, session.user.email);

    if (!access.ok) {
      return access.error;
    }

    try {
      const attachments = await listTransactionAttachments(access.wallet.tenantId, transactionId);

      return Response.json({ attachments });
    } catch (error) {
      console.error('Failed to list transaction attachments', error);

      return apiError('ATTACHMENTS_LOAD_FAILED', 500);
    }
  }

  if (request.method !== 'POST') {
    return ApiErrors.methodNotAllowed();
  }

  const access = await requireTransactionWriteAccess(tenantId, walletId, transactionId, session.user.email);

  if (!access.ok) {
    return access.error;
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return apiError('INVALID_MULTIPART', 400);
  }

  const files = [...formData.getAll('file'), ...formData.getAll('files')].filter(
    (value): value is File => value instanceof File,
  );

  if (files.length === 0) {
    return apiError('FILE_REQUIRED', 400);
  }

  const uploads = [];

  for (const file of files) {
    if (!isAcceptedAttachment(file)) {
      return apiError('UNSUPPORTED_FILE_TYPE', 400);
    }

    if (file.size <= 0) {
      return apiError('FILE_EMPTY', 400);
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return apiError('FILE_TOO_LARGE', 400);
    }

    const attachmentId = crypto.randomUUID();
    const fileName = sanitizeFileName(file.name);
    const body = new Uint8Array(await file.arrayBuffer());

    uploads.push(
      uploadTransactionAttachment({
        tenantId: access.wallet.tenantId,
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
    console.error('Failed to upload transaction attachment', error);

    return apiError('ATTACHMENT_UPLOAD_FAILED', 500);
  }
};

export const config: Config = {
  path: '/api/wallets/:walletId/transactions/:transactionId/attachments',
};
