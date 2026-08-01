import { Separator } from '@vhnam/ui/components/separator';
import { Spinner } from '@vhnam/ui/components/spinner';

import { AppPagination } from '#/components/app-pagination';
import { WalletMemberRow } from '#/modules/wallet-settings/wallet-settings-members/wallet-member-row';
import { WalletMembersInviteForm } from '#/modules/wallet-settings/wallet-settings-members/wallet-members-invite-form';
import { useWalletSettingsMembersActions } from '#/modules/wallet-settings/wallet-settings-members/wallet-settings-members.actions';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold">Members</h1>
        <p className="text-sm text-muted-foreground">Manage the members of this wallet.</p>
      </div>

      <WalletMembersInviteForm
        inviteEmail={inviteEmail}
        inviteRole={inviteRole}
        inviteError={inviteError}
        isInviting={isInviting}
        onInviteEmailChange={setInviteEmail}
        onInviteRoleChange={setInviteRole}
        onInvite={handleInvite}
      />

      {isLoadingMembers ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : (
        members.length > 0 && (
          <>
            <Separator />
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
          </>
        )
      )}
    </div>
  );
}

export { WalletSettingsMembers };
