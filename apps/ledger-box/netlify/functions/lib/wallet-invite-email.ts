import { WALLET_MEMBER_ROLE_DESCRIPTIONS, WALLET_MEMBER_ROLE_OPTIONS } from '#/constants/wallet-member-role-options.ts';
import type { WalletMemberRole } from '#/lib/db/schema.ts';

type BuildInviteEmailInput = {
  inviterName: string;
  inviterEmail: string;
  walletName: string;
  role: WalletMemberRole;
  acceptUrl: string;
};

type InviteEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function roleLabel(role: WalletMemberRole): string {
  return WALLET_MEMBER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function buildInviteEmail(input: BuildInviteEmailInput): InviteEmailContent {
  const inviterDisplay = input.inviterName.trim() || input.inviterEmail;
  const label = roleLabel(input.role);
  const description = WALLET_MEMBER_ROLE_DESCRIPTIONS[input.role];

  const subject = `${inviterDisplay} invited you to ${input.walletName} on Ledger Box`;

  const html = `
    <p>${inviterDisplay} (${input.inviterEmail}) invited you to the "${input.walletName}" wallet on Ledger Box as a <strong>${label}</strong>.</p>
    <p>${description}</p>
    <p><a href="${input.acceptUrl}">Accept the invite</a></p>
    <p>If you weren't expecting this invite, you can ignore this email.</p>
  `.trim();

  const text = [
    `${inviterDisplay} (${input.inviterEmail}) invited you to the "${input.walletName}" wallet on Ledger Box as a ${label}.`,
    description,
    `Accept the invite: ${input.acceptUrl}`,
    "If you weren't expecting this invite, you can ignore this email.",
  ].join('\n\n');

  return { subject, html, text };
}

export { buildInviteEmail, type BuildInviteEmailInput, type InviteEmailContent };
