import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { FormattedList, FormattedMessage } from 'react-intl';

import { Badge } from '@vhnam/ui/components/badge';
import { Button } from '@vhnam/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vhnam/ui/components/collapsible';
import { GoogleLogoIcon, Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';
import { cn } from '@vhnam/ui/lib/utils';

import { GUIDELINE_URL } from '#/constants/urls';

import { useSession } from '#/lib/auth/auth-client';

import { useConnectGoogle } from '#/queries/auth/auth.mutations';
import { useLinkedAccounts } from '#/queries/auth/auth.queries';
import { useWallets } from '#/queries/wallets/wallet.queries';

import { ChangePasswordForm } from '#/modules/settings/settings-account/settings-account-change-password-form';
import { DeleteAccountDialog } from '#/modules/settings/settings-account/settings-account-delete-dialog';
import { DisconnectGoogleDialog } from '#/modules/settings/settings-account/settings-account-disconnect-google-dialog';
import { SignInMethodRow } from '#/modules/settings/settings-account/settings-account-sign-in-row';

function SettingsAccount() {
  const { data: session } = useSession();
  const { data: linkedAccounts, isPending: isLinkedAccountsPending } = useLinkedAccounts();
  const { data: wallets } = useWallets();
  const connectGoogle = useConnectGoogle();

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [disconnectGoogleDialogOpen, setDisconnectGoogleDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  const googleAccount = linkedAccounts?.find((account) => account.providerId === 'google');
  const ownedWallets = wallets?.filter((wallet) => wallet.role === 'owner') ?? [];
  const hasOwnedWallets = ownedWallets.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="font-heading text-2xl font-semibold">
          <FormattedMessage id="settings.account.title" defaultMessage="Account" />
        </h1>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage id="settings.account.description" defaultMessage="Manage your account settings." />
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <FormattedMessage id="settings.account.signInMethods.title" defaultMessage="Sign in methods" />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col divide-y [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-4">
            <Collapsible open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
              <SignInMethodRow
                icon={<Icon name="EnvelopeSimpleIcon" className="size-4" />}
                title={<FormattedMessage id="settings.account.email.title" defaultMessage="Email & password" />}
                description={
                  session?.user.emailVerified ? (
                    <span className="flex items-center gap-1.5">
                      {session.user.email}
                      <Badge variant="secondary">
                        <FormattedMessage id="settings.account.email.verified" defaultMessage="Verified" />
                      </Badge>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      {session?.user.email}
                      <Badge variant="outline">
                        <FormattedMessage id="settings.account.email.unverified" defaultMessage="Unverified" />
                      </Badge>
                    </span>
                  )
                }
                action={
                  <CollapsibleTrigger render={<Button variant="outline" size="sm" />}>
                    {changePasswordOpen ? (
                      <FormattedMessage id="settings.account.changePassword.hide" defaultMessage="Hide" />
                    ) : (
                      <FormattedMessage id="settings.account.changePassword.cta" defaultMessage="Change password" />
                    )}
                  </CollapsibleTrigger>
                }
              />
              <CollapsibleContent>
                <div className="pt-4 lg:pt-6 lg:pl-12">
                  <ChangePasswordForm onSuccess={() => setChangePasswordOpen(false)} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <SignInMethodRow
              icon={<Icon icon={GoogleLogoIcon} className="size-4" />}
              title={<FormattedMessage id="settings.account.google.title" defaultMessage="Google" />}
              description={
                googleAccount ? (
                  <FormattedMessage id="settings.account.google.connected" defaultMessage="Connected" />
                ) : (
                  <FormattedMessage
                    id="settings.account.google.description"
                    defaultMessage="Sign in with your Google account"
                  />
                )
              }
              action={
                isLinkedAccountsPending ? (
                  <Spinner className="size-4" />
                ) : googleAccount ? (
                  <Button variant="outline" size="sm" onClick={() => setDisconnectGoogleDialogOpen(true)}>
                    <FormattedMessage id="settings.account.google.disconnect.cta" defaultMessage="Disconnect" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => connectGoogle.mutate()}
                    disabled={connectGoogle.isPending}
                  >
                    {connectGoogle.isPending && <Spinner className="size-4" />}
                    <FormattedMessage id="settings.account.google.connect.cta" defaultMessage="Connect" />
                  </Button>
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="border-b pb-4 text-lg font-semibold text-destructive">
          <FormattedMessage id="settings.account.delete.sectionTitle" defaultMessage="Delete account" />
        </h2>

        {hasOwnedWallets ? (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              <FormattedMessage
                id="settings.account.delete.ownedWallets"
                defaultMessage="Your account is currently an owner in these wallets:"
              />{' '}
              <FormattedList
                type="conjunction"
                value={ownedWallets.map((wallet) => (
                  <Link
                    key={wallet.id}
                    to="/wallets/$walletId/settings/general"
                    params={{ walletId: wallet.id }}
                    className="font-semibold text-foreground underline underline-offset-2 hover:text-foreground/80"
                  >
                    {wallet.name}
                  </Link>
                ))}
              />
            </p>
            <p>
              <FormattedMessage
                id="settings.account.delete.ownedWalletsHint"
                defaultMessage="You must <deleteLink>delete these wallets</deleteLink> or <transferLink>transfer ownership</transferLink> before you can delete your account."
                values={{
                  deleteLink: (chunks: ReactNode) => (
                    <a
                      href={GUIDELINE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                    >
                      {chunks}
                    </a>
                  ),
                  transferLink: (chunks: ReactNode) => (
                    <a
                      href={GUIDELINE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                    >
                      {chunks}
                    </a>
                  ),
                }}
              />
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              id="settings.account.delete.hint"
              defaultMessage="Once you delete your account, there is no going back. Please be certain."
            />
          </p>
        )}

        <div>
          <Button
            type="button"
            variant="outline"
            className={cn(!hasOwnedWallets && 'text-destructive hover:text-destructive')}
            disabled={hasOwnedWallets}
            onClick={() => setDeleteAccountDialogOpen(true)}
          >
            <FormattedMessage id="settings.account.delete.trigger" defaultMessage="Delete your account" />
          </Button>
        </div>
      </div>

      <DisconnectGoogleDialog
        open={disconnectGoogleDialogOpen}
        onOpenChange={setDisconnectGoogleDialogOpen}
        accountId={googleAccount?.id}
      />
      <DeleteAccountDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen} />
    </div>
  );
}

export { SettingsAccount };
