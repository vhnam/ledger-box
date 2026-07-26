import { useMutation, useQueryClient } from '@tanstack/react-query';

import { inviteWalletMember, removeWalletMember, updateWalletMemberRole } from '#/queries/wallets/wallet-member.api';
import type { InviteWalletMemberSchema, UpdateWalletMemberRoleSchema } from '#/schemas/wallet-member.schema';

export function useInviteWalletMember(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteWalletMemberSchema) => inviteWalletMember(walletId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet-members', walletId] });
    },
  });
}

export function useUpdateWalletMemberRole(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, ...payload }: UpdateWalletMemberRoleSchema & { memberId: string }) =>
      updateWalletMemberRole(walletId, memberId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet-members', walletId] });
    },
  });
}

export function useRemoveWalletMember(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeWalletMember(walletId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet-members', walletId] });
    },
  });
}
