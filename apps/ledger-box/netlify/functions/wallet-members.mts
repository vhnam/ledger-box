import type { Config, Context } from '@netlify/functions';
import { sql } from 'kysely';

import { WALLET_MEMBER_ROLES } from '#/constants/wallet-member-role-options.ts';
import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import type { WalletMemberRole } from '#/lib/db/schema.ts';

import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';
import { findUserByEmail, findUserById } from './lib/user-lookup.ts';
import { mapOwnerMember, mapWalletMember } from './lib/wallet-member-response.ts';

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
    return new Response('Unauthorized', { status: 401 });
  }

  const walletId = getWalletId(request, context);

  if (!walletId) {
    return new Response('Wallet id is required', { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  if (request.method === 'GET') {
    const ownerUser = await findUserById(tenantId);

    if (!ownerUser) {
      return new Response('Wallet owner not found', { status: 500 });
    }

    const members = await db
      .selectFrom('walletMember')
      .select(['id', 'email', 'userId', 'role', 'status'])
      .where('walletId', '=', walletId)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'asc')
      .execute();

    const memberResponses = await Promise.all(
      members.map(async (member) => {
        const user = member.userId
          ? await findUserById(member.userId)
          : await findUserByEmail(member.email.toLowerCase());

        return mapWalletMember(member, user);
      }),
    );

    return Response.json([mapOwnerMember(ownerUser), ...memberResponses]);
  }

  if (request.method === 'POST') {
    const body = (await request.json()) as InviteWalletMemberBody;

    if (typeof body.email !== 'string' || body.email.trim().length === 0) {
      return new Response('Email is required', { status: 400 });
    }

    if (!isWalletMemberRole(body.role)) {
      return new Response('Role is required', { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    const role = body.role;

    const ownerUser = await findUserById(tenantId);

    if (!ownerUser) {
      return new Response('Wallet owner not found', { status: 500 });
    }

    if (email === ownerUser.email.toLowerCase()) {
      return new Response('Wallet owner is already a member', { status: 400 });
    }

    const existingMember = await db
      .selectFrom('walletMember')
      .select(['id'])
      .where('walletId', '=', walletId)
      .where(sql`lower(email)`, '=', email)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (existingMember) {
      return new Response('This person is already a member or has a pending invite.', { status: 400 });
    }

    const invitedUser = await findUserByEmail(email);
    const now = new Date();

    const member = await db
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

    return Response.json(mapWalletMember(member, invitedUser), { status: 201 });
  }

  return new Response('Method Not Allowed', { status: 405 });
};

export const config: Config = {
  path: '/api/wallets/:walletId/members',
};
