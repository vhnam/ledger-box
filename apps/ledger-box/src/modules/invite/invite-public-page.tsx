import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Spinner } from '@vhnam/ui/components/spinner';

import { WALLET_MEMBER_ROLE_OPTIONS } from '#/constants/wallet-member-role-options';
import { useWalletInviteVerification } from '#/queries/wallet-invites/wallet-invite.queries';

type InvitePublicPageProps = {
  token: string;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.length > 0) {
      return data;
    }
  }

  return 'This invite link is not valid.';
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
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
          <Button variant="secondary" nativeButton={false} render={<Link to="/">Go home</Link>} />
        </>
      ) : data ? (
        <>
          <h1 className="font-heading text-lg font-medium">
            You&apos;ve been invited to {data.walletName} as {roleLabel}
          </h1>
          <Button
            size="lg"
            nativeButton={false}
            render={
              <Link to={data.requiresSignIn ? '/auth/login' : '/auth/register'}>
                {data.requiresSignIn ? 'Sign in to accept' : 'Create an account to accept'}
              </Link>
            }
          />
        </>
      ) : null}
    </div>
  );
}

export { InvitePublicPage };
