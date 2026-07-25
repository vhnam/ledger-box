import { useState } from 'react';
import * as v from 'valibot';

import { toast } from '@vhnam/ui/components/toast';

import { WALLET_MEMBER_ROLES, type WalletMemberRole } from '#/constants/wallet-member-role-options';
import {
  useInviteWalletMember,
  useRemoveWalletMember,
  useUpdateWalletMemberRole,
} from '#/queries/wallets/wallet-member.mutations';
import { useWalletMembers } from '#/queries/wallets/wallet-member.queries';
import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { inviteWalletMemberSchema } from '#/schemas/wallet-member.schema';

type UseWalletSettingsMembersActionsOptions = {
  wallet: WalletDto;
};

export function useWalletSettingsMembersActions({ wallet }: UseWalletSettingsMembersActionsOptions) {
  const { data: members = [], isPending: isLoadingMembers } = useWalletMembers(wallet.id);
  const { mutate: inviteMember, isPending: isInviting } = useInviteWalletMember(wallet.id);
  const { mutate: updateMemberRole } = useUpdateWalletMemberRole(wallet.id);
  const { mutate: removeMember } = useRemoveWalletMember(wallet.id);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WalletMemberRole>(WALLET_MEMBER_ROLES.VIEWER);
  const [inviteError, setInviteError] = useState<string | null>(null);

  function handleInvite() {
    setInviteError(null);

    const result = v.safeParse(inviteWalletMemberSchema, { email: inviteEmail, role: inviteRole });

    if (!result.success) {
      const message = result.issues[0]?.message ?? 'Enter a valid email address';
      setInviteError(message);
      return;
    }

    inviteMember(result.output, {
      onSuccess: (member) => {
        setInviteEmail('');
        toast.add({
          title: 'Invite sent',
          description: `Invitation sent to ${member.email} for ${wallet.name}.`,
          type: 'success',
        });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to send invite. Please try again.';
        setInviteError(message);
        toast.add({ title: 'Failed to send invite', description: message, type: 'error' });
      },
    });
  }

  function handleRoleChange(memberId: string, role: WalletMemberRole) {
    updateMemberRole(
      { memberId, role },
      {
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Failed to update member role. Please try again.';
          toast.add({ title: 'Failed to update role', description: message, type: 'error' });
        },
      },
    );
  }

  function handleRemoveMember(memberId: string) {
    removeMember(memberId, {
      onSuccess: () => {
        toast.add({ title: 'Member removed', type: 'success' });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to remove member. Please try again.';
        toast.add({ title: 'Failed to remove member', description: message, type: 'error' });
      },
    });
  }

  return {
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
  };
}
