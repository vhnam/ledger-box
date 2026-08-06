import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Spinner } from '@vhnam/ui/components/spinner';

import { WALLET_MEMBER_ROLE_OPTIONS } from '#/constants/wallet-member-role-options';
import { formatErrorMessage } from '#/lib/intl-message';
import { useWalletInviteVerification } from '#/queries/wallet-invites/wallet-invite.queries';

type InvitePublicPageProps = {
  token: string;
};

const INVITE_API_MESSAGE_IDS: Record<string, string> = {
  'This invite link is not valid.': 'invite.error.invalid',
  'This invite has already been used.': 'invite.error.alreadyUsed',
  'This invite link has expired.': 'invite.error.expired',
  'This wallet is no longer available.': 'invite.error.walletUnavailable',
};

function getInviteErrorMessage(intl: IntlShape, error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.length > 0) {
      const messageId = INVITE_API_MESSAGE_IDS[data];
      if (messageId) {
        return formatErrorMessage(intl, messageId);
      }

      return formatErrorMessage(intl, data);
    }
  }

  return formatErrorMessage(intl, 'invite.error.invalid');
}

function InvitePublicPage({ token }: InvitePublicPageProps) {
  const intl = useIntl();
  const { data, isPending, isError, error } = useWalletInviteVerification(token);

  const roleOption = data ? WALLET_MEMBER_ROLE_OPTIONS.find((option) => option.value === data.role) : undefined;
  const roleLabel = roleOption
    ? intl.formatMessage({ id: roleOption.labelId, defaultMessage: roleOption.defaultLabel })
    : data?.role;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 p-4 text-center">
      {isPending ? (
        <Spinner className="size-12 text-muted-foreground" />
      ) : isError ? (
        <>
          <p className="text-sm text-destructive">{getInviteErrorMessage(intl, error)}</p>
          <Button
            variant="secondary"
            nativeButton={false}
            render={
              <Link to="/">
                <FormattedMessage id="invite.cta.goHome" defaultMessage="Go home" />
              </Link>
            }
          />
        </>
      ) : data ? (
        <>
          <h1 className="font-heading text-lg font-medium">
            <FormattedMessage
              id="invite.heading"
              defaultMessage="You've been invited to {walletName} as {role}"
              values={{ walletName: data.walletName, role: roleLabel }}
            />
          </h1>
          <Button
            size="lg"
            nativeButton={false}
            render={
              <Link to={data.requiresSignIn ? '/auth/login' : '/auth/register'}>
                {data.requiresSignIn ? (
                  <FormattedMessage id="invite.cta.signIn" defaultMessage="Sign in to accept" />
                ) : (
                  <FormattedMessage id="invite.cta.register" defaultMessage="Create an account to accept" />
                )}
              </Link>
            }
          />
        </>
      ) : null}
    </div>
  );
}

export { InvitePublicPage };
