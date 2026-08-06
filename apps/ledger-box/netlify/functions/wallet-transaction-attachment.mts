import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { deleteTransactionAttachment } from '#/lib/r2.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireTransactionWriteAccess } from './lib/tenant-access.ts';

function getIds(
  request: Request,
  context: Context,
): { walletId: string | null; transactionId: string | null; attachmentId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramTransactionId = context.params?.transactionId;
  const paramAttachmentId = context.params?.attachmentId;

  if (
    typeof paramWalletId === 'string' &&
    paramWalletId.length > 0 &&
    typeof paramTransactionId === 'string' &&
    paramTransactionId.length > 0 &&
    typeof paramAttachmentId === 'string' &&
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

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  if (request.method !== 'DELETE') {
    return ApiErrors.methodNotAllowed();
  }

  const { walletId, transactionId, attachmentId } = getIds(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  if (!transactionId) {
    return apiError('TRANSACTION_ID_REQUIRED', 400);
  }

  if (!attachmentId) {
    return apiError('ATTACHMENT_ID_REQUIRED', 400);
  }

  const tenantId = getTenantId(session);
  const access = await requireTransactionWriteAccess(tenantId, walletId, transactionId, session.user.email);

  if (!access.ok) {
    return access.error;
  }

  try {
    const deleted = await deleteTransactionAttachment(access.wallet.tenantId, transactionId, attachmentId);

    if (!deleted) {
      return apiError('ATTACHMENT_NOT_FOUND', 404);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete transaction attachment', error);

    return apiError('ATTACHMENT_DELETE_FAILED', 500);
  }
};

export const config: Config = {
  path: '/api/wallets/:walletId/transactions/:transactionId/attachments/:attachmentId',
};
