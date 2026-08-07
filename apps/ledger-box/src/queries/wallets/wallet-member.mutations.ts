import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { InviteWalletMemberSchema, UpdateWalletMemberRoleSchema } from '#/schemas/wallet-member.schema';

import {
  inviteWalletMember,
  removeWalletMember,
  resendWalletInvite,
  updateWalletMemberRole,
} from '#/queries/wallets/wallet-member.api';

export function useInviteWalletMember(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteWalletMemberSchema) => inviteWalletMember(walletId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet-members', walletId] }),
        queryClient.invalidateQueries({ queryKey: ['activity', walletId] }),
      ]);
    },
  });
}

export function useUpdateWalletMemberRole(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, ...payload }: UpdateWalletMemberRoleSchema & { memberId: string }) =>
      updateWalletMemberRole(walletId, memberId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet-members', walletId] }),
        queryClient.invalidateQueries({ queryKey: ['activity', walletId] }),
      ]);
    },
  });
}

export function useRemoveWalletMember(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeWalletMember(walletId, memberId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet-members', walletId] }),
        queryClient.invalidateQueries({ queryKey: ['activity', walletId] }),
      ]);
    },
  });
}

export function useResendWalletInvite(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => resendWalletInvite(walletId, memberId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet-members', walletId] }),
        queryClient.invalidateQueries({ queryKey: ['activity', walletId] }),
      ]);
    },
  });
}
