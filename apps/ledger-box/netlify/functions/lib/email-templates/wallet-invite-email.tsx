import { renderToStaticMarkup } from 'react-dom/server';

import { WALLET_MEMBER_ROLE_DESCRIPTIONS, WALLET_MEMBER_ROLE_OPTIONS } from '#/constants/wallet-member-role-options.ts';
import type { WalletMemberRole } from '#/lib/db/schema.ts';

import { EmailLayout } from './email-layout.tsx';

type WalletInviteEmailInput = {
  inviterName: string;
  inviterEmail: string;
  walletName: string;
  role: WalletMemberRole;
  acceptUrl: string;
};

type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

const paragraphStyle = { margin: '0 0 16px' };

function roleLabel(role: WalletMemberRole): string {
  return WALLET_MEMBER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function WalletInviteEmailBody({ inviterName, inviterEmail, walletName, role, acceptUrl }: WalletInviteEmailInput) {
  const inviterDisplay = inviterName.trim() || inviterEmail;
  const label = roleLabel(role);
  const description = WALLET_MEMBER_ROLE_DESCRIPTIONS[role];

  return (
    <EmailLayout>
      <p style={paragraphStyle}>
        {inviterDisplay} ({inviterEmail}) invited you to the "{walletName}" wallet on Ledger Box as a{' '}
        <strong>{label}</strong>.
      </p>
      <p style={paragraphStyle}>{description}</p>
      <p style={paragraphStyle}>
        <a href={acceptUrl}>Accept the invite</a>
      </p>
      <p style={{ ...paragraphStyle, marginBottom: 0 }}>
        If you weren't expecting this invite, you can ignore this email.
      </p>
    </EmailLayout>
  );
}

function renderWalletInviteEmail(input: WalletInviteEmailInput): EmailContent {
  const inviterDisplay = input.inviterName.trim() || input.inviterEmail;
  const label = roleLabel(input.role);
  const description = WALLET_MEMBER_ROLE_DESCRIPTIONS[input.role];

  const subject = `${inviterDisplay} invited you to ${input.walletName} on Ledger Box`;

  const html = renderToStaticMarkup(<WalletInviteEmailBody {...input} />);

  const text = [
    `${inviterDisplay} (${input.inviterEmail}) invited you to the "${input.walletName}" wallet on Ledger Box as a ${label}.`,
    description,
    `Accept the invite: ${input.acceptUrl}`,
    "If you weren't expecting this invite, you can ignore this email.",
  ].join('\n\n');

  return { subject, html, text };
}

export { renderWalletInviteEmail, WalletInviteEmailBody, type WalletInviteEmailInput, type EmailContent };
