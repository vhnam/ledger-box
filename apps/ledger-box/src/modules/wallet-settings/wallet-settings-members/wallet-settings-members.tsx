import { FormattedMessage, useIntl } from 'react-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@vhnam/ui/components/ui/card';
import { Skeleton } from '@vhnam/ui/components/ui/skeleton';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

import { AppPagination } from '#/components/app-pagination';

import { WalletMemberRow } from './wallet-member-row';
import { WalletMembersInviteForm } from './wallet-members-invite-form';
import { useWalletSettingsMembersActions } from './wallet-settings-members.actions';

type WalletSettingsMembersProps = {
  wallet: WalletDto;
};

function WalletSettingsMembers({ wallet }: WalletSettingsMembersProps) {
  const intl = useIntl();
  const {
    members,
    totalResults,
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
  const showPagination = totalPages > 1;
  const resultLabel =
    totalResults === 1
      ? intl.formatMessage({ id: 'wallet.settings.members.resultOne', defaultMessage: '1 result' })
      : intl.formatMessage(
          { id: 'wallet.settings.members.resultOther', defaultMessage: '{count} results' },
          { count: totalResults },
        );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="font-display text-2xl font-semibold">
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

      <div className="flex flex-col gap-4">
        {isLoadingMembers ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : null}

        {!isLoadingMembers && members.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <FormattedMessage id="wallet.settings.members.title" defaultMessage="Members" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{resultLabel}</span>
            </div>
            <ul className="space-y-4">
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
          </div>
        ) : null}

        {showPagination ? (
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
    </div>
  );
}

export { WalletSettingsMembers };
