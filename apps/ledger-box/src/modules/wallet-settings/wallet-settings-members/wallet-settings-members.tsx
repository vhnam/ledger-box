import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Separator } from '@vhnam/ui/components/separator';
import { Spinner } from '@vhnam/ui/components/spinner';

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
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Manage the members of this wallet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}

export { WalletSettingsMembers };
