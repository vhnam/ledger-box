import type { Config, Context } from '@netlify/functions';

import { db } from '#/lib/db/index.ts';
import { hashShareToken } from '#/lib/share-token.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { findUserByEmail } from './lib/user-lookup.ts';

function getToken(request: Request, context: Context): string | null {
  const paramToken = context.params?.token;

  if (typeof paramToken === 'string' && paramToken.length > 0) {
    return paramToken;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/invites\/([^/]+)$/);

  return match?.[1] ?? null;
}

export default async (request: Request, context: Context) => {
  if (request.method !== 'GET') {
    return ApiErrors.methodNotAllowed();
  }

  const token = getToken(request, context);

  if (!token) {
    return apiError('INVITE_NOT_VALID', 404);
  }

  const tokenHash = await hashShareToken(token);

  const member = await db
    .selectFrom('walletMember')
    .select(['id', 'walletId', 'email', 'role', 'status', 'inviteTokenExpiresAt'])
    .where('inviteTokenHash', '=', tokenHash)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();

  if (!member) {
    return apiError('INVITE_NOT_VALID', 404);
  }

  if (member.status !== 'pending') {
    return apiError('INVITE_ALREADY_USED', 410);
  }

  if (member.inviteTokenExpiresAt && new Date(member.inviteTokenExpiresAt).getTime() <= Date.now()) {
    return apiError('INVITE_EXPIRED', 410);
  }

  const wallet = await db
    .selectFrom('wallet')
    .select(['id', 'name', 'deletedAt'])
    .where('id', '=', member.walletId)
    .executeTakeFirst();

  if (!wallet || wallet.deletedAt) {
    return apiError('INVITE_WALLET_UNAVAILABLE', 410);
  }

  const existingUser = await findUserByEmail(member.email.toLowerCase());

  return Response.json({
    walletId: wallet.id,
    walletName: wallet.name,
    role: member.role,
    requiresSignIn: !!existingUser,
  });
};

export const config: Config = {
  path: '/api/wallets/invites/:token',
};
