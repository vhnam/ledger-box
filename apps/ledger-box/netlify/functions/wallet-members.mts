import type { Config, Context } from '@netlify/functions';
import { sql } from 'kysely';

import { WALLET_MEMBER_ROLES } from '#/constants/wallet-member-role-options.ts';
import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import type { WalletMemberRole } from '#/lib/db/schema.ts';
import { generateShareToken } from '#/lib/share-token.ts';

import { recordActivity } from './lib/activity-log.ts';
import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { renderWalletInviteEmail } from './lib/email-templates/wallet-invite-email.tsx';
import { sendEmail } from './lib/mailer.ts';
import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';
import { findUserByEmail, findUserById } from './lib/user-lookup.ts';
import { mapOwnerMember, mapWalletMember } from './lib/wallet-member-response.ts';

const INVITE_TOKEN_EXPIRY_DAYS = 7;

type InviteWalletMemberBody = {
  email?: unknown;
  role?: unknown;
};

function getWalletId(request: Request, context: Context): string | null {
  const paramWalletId = context.params?.walletId;

  if (typeof paramWalletId === 'string' && paramWalletId.length > 0) {
    return paramWalletId;
  }

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/members$/);

  return match?.[1] ?? null;
}

function isWalletMemberRole(value: unknown): value is WalletMemberRole {
  return value === WALLET_MEMBER_ROLES.VIEWER || value === WALLET_MEMBER_ROLES.MANAGER;
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return apiError('WALLET_ID_REQUIRED', 400);
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  if (request.method === 'GET') {
    const ownerUser = await findUserById(tenantId);

    if (!ownerUser) {
      return apiError('WALLET_OWNER_NOT_FOUND', 500);
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20));

    // The owner is a synthetic entry (not stored in walletMember) that's always sorted first,
    // so it occupies slot 0 of the combined list and DB members are offset by one place behind it.
    const countResult = await db
      .selectFrom('walletMember')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('walletId', '=', walletId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    const memberCount = Number(countResult?.count ?? 0);
    const total = memberCount + 1;

    const combinedOffset = (page - 1) * pageSize;
    const includeOwner = combinedOffset === 0;
    const dbOffset = includeOwner ? 0 : combinedOffset - 1;
    const dbLimit = includeOwner ? pageSize - 1 : pageSize;

    const members =
      dbLimit > 0
        ? await db
            .selectFrom('walletMember')
            .select(['id', 'email', 'userId', 'role', 'status'])
            .where('walletId', '=', walletId)
            .where('deletedAt', 'is', null)
            .orderBy('createdAt', 'asc')
            .limit(dbLimit)
            .offset(dbOffset)
            .execute()
        : [];

    const memberResponses = await Promise.all(
      members.map(async (member) => {
        const user = member.userId
          ? await findUserById(member.userId)
          : await findUserByEmail(member.email.toLowerCase());

        return mapWalletMember(member, user);
      }),
    );

    const items = includeOwner ? [mapOwnerMember(ownerUser), ...memberResponses] : memberResponses;

    return Response.json({ items, total, page, pageSize });
  }

  if (request.method === 'POST') {
    const body = (await request.json()) as InviteWalletMemberBody;

    if (typeof body.email !== 'string' || body.email.trim().length === 0) {
      return apiError('EMAIL_REQUIRED', 400);
    }

    if (!isWalletMemberRole(body.role)) {
      return apiError('ROLE_REQUIRED', 400);
    }

    const email = body.email.trim().toLowerCase();
    const role = body.role;

    const ownerUser = await findUserById(tenantId);

    if (!ownerUser) {
      return apiError('WALLET_OWNER_NOT_FOUND', 500);
    }

    if (email === ownerUser.email.toLowerCase()) {
      return apiError('OWNER_ALREADY_MEMBER', 400);
    }

    const existingMember = await db
      .selectFrom('walletMember')
      .select(['id'])
      .where('walletId', '=', walletId)
      .where(sql`lower(email)`, '=', email)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (existingMember) {
      return apiError('MEMBER_ALREADY_EXISTS', 400);
    }

    const invitedUser = await findUserByEmail(email);
    const now = new Date();
    const actor = { userId: session.user.id, email: session.user.email };

    const member = await db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('walletMember')
        .values({
          walletId,
          email,
          userId: invitedUser?.id ?? null,
          createdAt: now,
          role,
          status: 'pending',
          updatedAt: now,
        })
        .returning(['id', 'email', 'userId', 'role', 'status'])
        .executeTakeFirstOrThrow();

      await recordActivity(trx, {
        walletId,
        tenantId: ownership.wallet.tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'wallet_member',
        entityId: created.id,
        action: 'invite',
        before: null,
        after: { email: created.email, role: created.role, status: created.status },
      });

      return created;
    });

    const { raw: rawToken, hash: tokenHash } = await generateShareToken();
    const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const invitedAt = new Date();

    await db
      .updateTable('walletMember')
      .set({
        inviteTokenHash: tokenHash,
        inviteTokenExpiresAt,
        lastInvitedAt: invitedAt,
        inviteSendCount: (eb) => eb('inviteSendCount', '+', 1),
      })
      .where('id', '=', member.id)
      .execute();

    const acceptUrl = new URL(`/invite/${rawToken}`, process.env.BETTER_AUTH_URL).toString();
    const { subject, html, text } = renderWalletInviteEmail({
      inviterName: session.user.name ?? '',
      inviterEmail: session.user.email,
      walletName: ownership.wallet.name,
      role,
      acceptUrl,
    });

    const sendResult = await sendEmail({ to: email, subject, html, text });

    if (!sendResult.ok) {
      await recordActivity(db, {
        walletId,
        tenantId: ownership.wallet.tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        entityType: 'wallet_member',
        entityId: member.id,
        action: 'invite_email_failed',
        before: null,
        after: { email, error: sendResult.error },
      });
    }

    return Response.json({ ...mapWalletMember(member, invitedUser), emailSent: sendResult.ok }, { status: 201 });
  }

  return ApiErrors.methodNotAllowed();
};

export const config: Config = {
  path: '/api/wallets/:walletId/members',
};
