import { FormattedMessage } from 'react-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Spinner } from '@vhnam/ui/components/spinner';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

import { AppPagination } from '#/components/app-pagination';

import { WalletMemberRow } from '#/modules/wallet-settings/wallet-settings-members/wallet-member-row';
import { WalletMembersInviteForm } from '#/modules/wallet-settings/wallet-settings-members/wallet-members-invite-form';
import { useWalletSettingsMembersActions } from '#/modules/wallet-settings/wallet-settings-members/wallet-settings-members.actions';

type WalletSettingsMembersProps = {
  wallet: WalletDto;
};

function WalletSettingsMembers({ wallet }: WalletSettingsMembersProps) {
  const {
    members,
    isLoadingMembers,
    page,
    totalPages,
    pageItems,
    canGoPrevious,
    canGoNext,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteError,
    isInviting,
    handleInvite,
    handleRoleChange,
    handleRemoveMember,
    handleResendInvite,
  } = useWalletSettingsMembersActions({ wallet });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="font-heading text-2xl font-semibold">
          <FormattedMessage id="wallet.settings.members.title" defaultMessage="Members" />
        </h1>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="wallet.settings.members.description"
            defaultMessage="Manage the members of this wallet."
          />
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <FormattedMessage id="wallet.settings.members.invite.label" defaultMessage="Invite by email" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WalletMembersInviteForm
            inviteEmail={inviteEmail}
            inviteRole={inviteRole}
            inviteError={inviteError}
            isInviting={isInviting}
            onInviteEmailChange={setInviteEmail}
            onInviteRoleChange={setInviteRole}
            onInvite={handleInvite}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <FormattedMessage id="wallet.settings.members.title" defaultMessage="Members" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : members.length > 0 ? (
            <div className="flex flex-col gap-4">
              <ul className="divide-y divide-border">
                {members.map((member) => (
                  <WalletMemberRow
                    key={member.id}
                    member={member}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemoveMember}
                    onResend={handleResendInvite}
                  />
                ))}
              </ul>
              {totalPages > 1 ? (
                <AppPagination
                  page={page}
                  totalPages={totalPages}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  pageItems={pageItems}
                  goToPage={goToPage}
                  goToPreviousPage={goToPreviousPage}
                  goToNextPage={goToNextPage}
                />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export { WalletSettingsMembers };
