import type { Config, Context } from '@netlify/functions';

import { WALLET_MEMBER_ROLES } from '#/constants/wallet-member-role-options.ts';
import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import type { WalletMemberRole } from '#/lib/db/schema.ts';

import { recordActivity } from './lib/activity-log.ts';
import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';
import { findUserByEmail, findUserById } from './lib/user-lookup.ts';
import { mapWalletMember } from './lib/wallet-member-response.ts';

type UpdateWalletMemberBody = {
  role?: unknown;
};

function getIds(request: Request, context: Context): { walletId: string | null; memberId: string | null } {
  const paramWalletId = context.params?.walletId;
  const paramMemberId = context.params?.memberId;

  if (
    typeof paramWalletId === 'string' &&
    paramWalletId.length > 0 &&
    typeof paramMemberId === 'string' &&
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
    return ApiErrors.unauthorized();
  }

  if (request.method !== 'PATCH' && request.method !== 'DELETE') {
    return ApiErrors.methodNotAllowed();
  }

  const { walletId, memberId } = getIds(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  if (!memberId) {
    return apiError('MEMBER_ID_REQUIRED', 400);
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const existingMember = await db
    .selectFrom('walletMember')
    .select(['id', 'email', 'userId', 'role', 'status'])
    .where('id', '=', memberId)
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();

  if (!existingMember) {
    return apiError('MEMBER_NOT_FOUND', 404);
  }

  const actor = { userId: session.user.id, email: session.user.email };

  if (request.method === 'DELETE') {
    const now = new Date();

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('walletMember')
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where('id', '=', memberId)
        .where('walletId', '=', walletId)
        .execute();

      await recordActivity(trx, {
        walletId,
        tenantId: ownership.wallet.tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'wallet_member',
        entityId: memberId,
        action: 'delete',
        before: { email: existingMember.email, role: existingMember.role, status: existingMember.status },
        after: null,
      });
    });

    return Response.json({ success: true });
  }

  const body = (await request.json()) as UpdateWalletMemberBody;

  if (!isWalletMemberRole(body.role)) {
    return apiError('ROLE_REQUIRED', 400);
  }

  const nextRole = body.role;

  const member = await db.transaction().execute(async (trx) => {
    const updated = await trx
      .updateTable('walletMember')
      .set({
        role: nextRole,
        updatedAt: new Date(),
      })
      .where('id', '=', memberId)
      .where('walletId', '=', walletId)
      .where('deletedAt', 'is', null)
      .returning(['id', 'email', 'userId', 'role', 'status'])
      .executeTakeFirstOrThrow();

    await recordActivity(trx, {
      walletId,
      tenantId: ownership.wallet.tenantId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      entityType: 'wallet_member',
      entityId: memberId,
      action: 'role_change',
      before: { email: existingMember.email, role: existingMember.role },
      after: { email: updated.email, role: updated.role },
    });

    return updated;
  });

  const user = member.userId ? await findUserById(member.userId) : await findUserByEmail(member.email.toLowerCase());

  return Response.json(mapWalletMember(member, user));
};

export const config: Config = {
  path: '/api/wallets/:walletId/members/:memberId',
};
