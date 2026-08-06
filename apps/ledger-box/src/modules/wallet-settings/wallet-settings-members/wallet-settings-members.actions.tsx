import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import * as v from 'valibot';

import { toast } from '@vhnam/ui/components/toast';

import { WALLET_MEMBER_ROLES, type WalletMemberRole } from '#/constants/wallet-member-role-options';
import { formatErrorMessage } from '#/lib/intl-message';
import { getPageItems } from '#/lib/pagination';
import {
  useInviteWalletMember,
  useRemoveWalletMember,
  useResendWalletInvite,
  useUpdateWalletMemberRole,
} from '#/queries/wallets/wallet-member.mutations';
import { useWalletMembers } from '#/queries/wallets/wallet-member.queries';
import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { inviteWalletMemberSchema } from '#/schemas/wallet-member.schema';

type UseWalletSettingsMembersActionsOptions = {
  wallet: WalletDto;
};

export function useWalletSettingsMembersActions({ wallet }: UseWalletSettingsMembersActionsOptions) {
  const intl = useIntl();
  const [page, setPage] = useState(1);
  const { data, isPending: isLoadingMembers, isFetching: isFetchingMembers } = useWalletMembers(wallet.id, page);
  const members = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  }

  function goToPreviousPage() {
    goToPage(page - 1);
  }

  function goToNextPage() {
    goToPage(page + 1);
  }

  const { mutate: inviteMember, isPending: isInviting } = useInviteWalletMember(wallet.id);
  const { mutate: updateMemberRole } = useUpdateWalletMemberRole(wallet.id);
  const { mutate: removeMember } = useRemoveWalletMember(wallet.id);
  const { mutate: resendInvite } = useResendWalletInvite(wallet.id);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WalletMemberRole>(WALLET_MEMBER_ROLES.VIEWER);
  const [inviteError, setInviteError] = useState<string | null>(null);

  function handleInvite() {
    setInviteError(null);

    const result = v.safeParse(inviteWalletMemberSchema, { email: inviteEmail, role: inviteRole });

    if (!result.success) {
      const message = result.issues[0]?.message ?? 'validation.member.email.invalid';
      setInviteError(message);
      return;
    }

    inviteMember(result.output, {
      onSuccess: (member) => {
        setInviteEmail('');

        if (member.emailSent === false) {
          toast.add({
            title: intl.formatMessage({
              id: 'toast.members.inviteCreatedNoEmail',
              defaultMessage: 'Invite created, email not sent',
            }),
            description: intl.formatMessage(
              {
                id: 'toast.members.inviteCreatedNoEmail.description',
                defaultMessage:
                  '{email} was added as a pending member, but the notification email could not be delivered. Check the wallet activity log or resend later.',
              },
              { email: member.email },
            ),
            type: 'warning',
          });
          return;
        }

        toast.add({
          title: intl.formatMessage({ id: 'toast.members.inviteSent', defaultMessage: 'Invite sent' }),
          description: intl.formatMessage(
            {
              id: 'toast.members.inviteSent.description',
              defaultMessage: 'Invitation sent to {email} for {walletName}.',
            },
            { email: member.email, walletName: wallet.name },
          ),
          type: 'success',
        });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'toast.members.inviteErrorFallback';
        setInviteError(message);
        toast.add({
          title: intl.formatMessage({ id: 'toast.members.inviteFailed', defaultMessage: 'Failed to send invite' }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  function handleRoleChange(memberId: string, role: WalletMemberRole) {
    updateMemberRole(
      { memberId, role },
      {
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'toast.members.roleUpdateErrorFallback';
          toast.add({
            title: intl.formatMessage({
              id: 'toast.members.roleUpdateFailed',
              defaultMessage: 'Failed to update role',
            }),
            description: formatErrorMessage(intl, message),
            type: 'error',
          });
        },
      },
    );
  }

  function handleRemoveMember(memberId: string) {
    removeMember(memberId, {
      onSuccess: () => {
        toast.add({
          title: intl.formatMessage({ id: 'toast.members.removed', defaultMessage: 'Member removed' }),
          type: 'success',
        });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'toast.members.removeErrorFallback';
        toast.add({
          title: intl.formatMessage({ id: 'toast.members.removeFailed', defaultMessage: 'Failed to remove member' }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  function handleResendInvite(memberId: string) {
    resendInvite(memberId, {
      onSuccess: (result) => {
        if (!result.emailSent) {
          toast.add({
            title: intl.formatMessage({
              id: 'toast.members.inviteRefreshedNoEmail',
              defaultMessage: 'Invite refreshed, email not sent',
            }),
            description: intl.formatMessage({
              id: 'toast.members.inviteRefreshedNoEmail.description',
              defaultMessage: 'The invite link was renewed, but the notification email could not be delivered.',
            }),
            type: 'warning',
          });
          return;
        }

        toast.add({
          title: intl.formatMessage({ id: 'toast.members.inviteResent', defaultMessage: 'Invite resent' }),
          type: 'success',
        });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'toast.members.resendErrorFallback';
        toast.add({
          title: intl.formatMessage({ id: 'toast.members.resendFailed', defaultMessage: 'Failed to resend invite' }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  return {
    members,
    isLoadingMembers,
    isFetchingMembers,
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
  };
}
