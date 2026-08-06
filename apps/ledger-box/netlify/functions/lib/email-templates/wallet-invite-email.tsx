import { DEFAULT_LOCALE, type SupportedLocale } from '@vhnam/utils';
import { renderToStaticMarkup } from 'react-dom/server';
import type { IntlShape } from 'react-intl';

import { WALLET_MEMBER_ROLE_OPTIONS } from '#/constants/wallet-member-role-options.ts';
import type { WalletMemberRole } from '#/lib/db/schema.ts';

import { createServerIntl } from '../server-intl.ts';
import { EmailLayout } from './email-layout.tsx';

type WalletInviteEmailInput = {
  inviterName: string;
  inviterEmail: string;
  walletName: string;
  role: WalletMemberRole;
  acceptUrl: string;
  /** Inviter's stored locale; defaults to `en-US`. */
  locale?: SupportedLocale;
};

type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

const paragraphStyle = { margin: '0 0 16px' };

function roleOption(role: WalletMemberRole) {
  return WALLET_MEMBER_ROLE_OPTIONS.find((option) => option.value === role);
}

function roleLabel(intl: IntlShape, role: WalletMemberRole): string {
  const option = roleOption(role);
  if (!option) {
    return role;
  }

  return intl.formatMessage({ id: option.labelId, defaultMessage: option.defaultLabel });
}

function roleDescription(intl: IntlShape, role: WalletMemberRole): string {
  const option = roleOption(role);
  if (!option) {
    return '';
  }

  return intl.formatMessage({ id: option.descriptionId, defaultMessage: option.defaultDescription });
}

function WalletInviteEmailBody({
  inviterName,
  inviterEmail,
  walletName,
  role,
  acceptUrl,
  locale = DEFAULT_LOCALE,
}: WalletInviteEmailInput) {
  const intl = createServerIntl(locale);
  const inviterDisplay = inviterName.trim() || inviterEmail;
  const label = roleLabel(intl, role);
  const description = roleDescription(intl, role);

  return (
    <EmailLayout>
      <p style={paragraphStyle}>
        {intl.formatMessage(
          {
            id: 'email.invite.body',
            defaultMessage:
              '{inviterDisplay} ({inviterEmail}) invited you to the "{walletName}" wallet on Ledger Box as a {role}.',
          },
          { inviterDisplay, inviterEmail, walletName, role: label },
        )}
      </p>
      <p style={paragraphStyle}>{description}</p>
      <p style={paragraphStyle}>
        <a href={acceptUrl}>{intl.formatMessage({ id: 'email.invite.accept', defaultMessage: 'Accept the invite' })}</a>
      </p>
      <p style={{ ...paragraphStyle, marginBottom: 0 }}>
        {intl.formatMessage({
          id: 'email.invite.ignore',
          defaultMessage: "If you weren't expecting this invite, you can ignore this email.",
        })}
      </p>
    </EmailLayout>
  );
}

function renderWalletInviteEmail(input: WalletInviteEmailInput): EmailContent {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const intl = createServerIntl(locale);
  const inviterDisplay = input.inviterName.trim() || input.inviterEmail;
  const label = roleLabel(intl, input.role);
  const description = roleDescription(intl, input.role);

  const subject = intl.formatMessage(
    {
      id: 'email.invite.subject',
      defaultMessage: '{inviterDisplay} invited you to {walletName} on Ledger Box',
    },
    { inviterDisplay, walletName: input.walletName },
  );

  const html = renderToStaticMarkup(<WalletInviteEmailBody {...input} locale={locale} />);

  const text = [
    intl.formatMessage(
      {
        id: 'email.invite.body',
        defaultMessage:
          '{inviterDisplay} ({inviterEmail}) invited you to the "{walletName}" wallet on Ledger Box as a {role}.',
      },
      {
        inviterDisplay,
        inviterEmail: input.inviterEmail,
        walletName: input.walletName,
        role: label,
      },
    ),
    description,
    intl.formatMessage(
      { id: 'email.invite.acceptText', defaultMessage: 'Accept the invite: {acceptUrl}' },
      { acceptUrl: input.acceptUrl },
    ),
    intl.formatMessage({
      id: 'email.invite.ignore',
      defaultMessage: "If you weren't expecting this invite, you can ignore this email.",
    }),
  ].join('\n\n');

  return { subject, html, text };
}

export { renderWalletInviteEmail, WalletInviteEmailBody, type WalletInviteEmailInput, type EmailContent };
