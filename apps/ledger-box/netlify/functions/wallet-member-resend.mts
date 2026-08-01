import type { Config, Context } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';
import { db } from '#/lib/db/index.ts';
import { generateShareToken } from '#/lib/share-token.ts';

import { recordActivity } from './lib/activity-log.ts';
import { renderWalletInviteEmail } from './lib/email-templates/wallet-invite-email.tsx';
import { sendEmail } from './lib/mailer.ts';
import { getTenantId, requireOwnedWallet } from './lib/tenant-access.ts';

const INVITE_TOKEN_EXPIRY_DAYS = 7;
const RESEND_RATE_WINDOW_MS = 60_000;
const RESEND_RATE_WINDOW_LIMIT = 5;

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

  const match = new URL(request.url).pathname.match(/^\/api\/wallets\/([^/]+)\/members\/([^/]+)\/resend$/);

  return {
    walletId: match?.[1] ?? null,
    memberId: match?.[2] ?? null,
  };
}

export default async (request: Request, context: Context) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { walletId, memberId } = getIds(request, context);

  if (!walletId) {
    return new Response('Wallet id is required', { status: 400 });
  }

  if (!memberId) {
    return new Response('Member id is required', { status: 400 });
  }

  const tenantId = getTenantId(session);
  const ownership = await requireOwnedWallet(tenantId, walletId);

  if (!ownership.ok) {
    return ownership.error;
  }

  const existingMember = await db
    .selectFrom('walletMember')
    .select(['id', 'email', 'role', 'status'])
    .where('id', '=', memberId)
    .where('walletId', '=', walletId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();

  if (!existingMember) {
    return new Response('Member not found', { status: 404 });
  }

  if (existingMember.status !== 'pending') {
    return new Response('Only pending invites can be resent', { status: 400 });
  }

  const now = Date.now();
  const rateInfo = await db
    .selectFrom('wallet')
    .select(['inviteRateWindowStart', 'inviteRateWindowCount'])
    .where('id', '=', walletId)
    .executeTakeFirstOrThrow();

  const windowStart = rateInfo.inviteRateWindowStart ? new Date(rateInfo.inviteRateWindowStart).getTime() : null;
  const withinWindow = windowStart !== null && now - windowStart < RESEND_RATE_WINDOW_MS;

  if (withinWindow && rateInfo.inviteRateWindowCount >= RESEND_RATE_WINDOW_LIMIT) {
    return new Response('Too many invite emails sent. Please try again shortly.', { status: 429 });
  }

  const nextRateWindowStart = withinWindow ? new Date(windowStart) : new Date(now);
  const nextRateWindowCount = withinWindow ? rateInfo.inviteRateWindowCount + 1 : 1;

  await db
    .updateTable('wallet')
    .set({
      inviteRateWindowStart: nextRateWindowStart,
      inviteRateWindowCount: nextRateWindowCount,
    })
    .where('id', '=', walletId)
    .execute();

  const { raw: rawToken, hash: tokenHash } = await generateShareToken();
  const inviteTokenExpiresAt = new Date(now + INVITE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const lastInvitedAt = new Date(now);

  await db
    .updateTable('walletMember')
    .set({
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt,
      lastInvitedAt,
      inviteSendCount: (eb) => eb('inviteSendCount', '+', 1),
    })
    .where('id', '=', memberId)
    .execute();

  const acceptUrl = new URL(`/invite/${rawToken}`, process.env.BETTER_AUTH_URL).toString();
  const { subject, html, text } = renderWalletInviteEmail({
    inviterName: session.user.name ?? '',
    inviterEmail: session.user.email,
    walletName: ownership.wallet.name,
    role: existingMember.role,
    acceptUrl,
  });

  const sendResult = await sendEmail({ to: existingMember.email, subject, html, text });
  const actor = { userId: session.user.id, email: session.user.email };

  await recordActivity(db, {
    walletId,
    tenantId: ownership.wallet.tenantId,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    entityType: 'wallet_member',
    entityId: memberId,
    action: 'invite_resend',
    before: null,
    after: sendResult.ok
      ? { email: existingMember.email, sentAt: lastInvitedAt.toISOString() }
      : { email: existingMember.email, sentAt: lastInvitedAt.toISOString(), error: sendResult.error },
  });

  return Response.json({ id: memberId, emailSent: sendResult.ok, lastInvitedAt: lastInvitedAt.toISOString() });
};

export const config: Config = {
  path: '/api/wallets/:walletId/members/:memberId/resend',
};
