import axios from 'axios';

import type { WalletMemberRole } from '#/constants/wallet-member-role-options';
import { getApiErrorMessage } from '#/lib/api-error';
import type { WalletMemberDto, WalletMemberListDto } from '#/queries/wallets/wallet-member.dto';
import type { InviteWalletMemberSchema, UpdateWalletMemberRoleSchema } from '#/schemas/wallet-member.schema';

export async function fetchWalletMembers(walletId: string, page = 1, pageSize = 10): Promise<WalletMemberListDto> {
  const { data } = await axios.get<WalletMemberListDto>(`/api/wallets/${walletId}/members`, {
    params: { page, pageSize },
  });

  return data;
}

export async function inviteWalletMember(
  walletId: string,
  payload: InviteWalletMemberSchema,
): Promise<WalletMemberDto> {
  try {
    const { data } = await axios.post<WalletMemberDto>(`/api/wallets/${walletId}/members`, payload);

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to send invite. Please try again.'));
  }
}

export async function updateWalletMemberRole(
  walletId: string,
  memberId: string,
  payload: UpdateWalletMemberRoleSchema,
): Promise<WalletMemberDto> {
  try {
    const { data } = await axios.patch<WalletMemberDto>(`/api/wallets/${walletId}/members/${memberId}`, payload);

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to update member role. Please try again.'));
  }
}

export async function removeWalletMember(walletId: string, memberId: string): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}/members/${memberId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to remove member. Please try again.'));
  }
}

export async function resendWalletInvite(
  walletId: string,
  memberId: string,
): Promise<{ id: string; emailSent: boolean; lastInvitedAt: string }> {
  try {
    const { data } = await axios.post<{ id: string; emailSent: boolean; lastInvitedAt: string }>(
      `/api/wallets/${walletId}/members/${memberId}/resend`,
    );

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to resend invite. Please try again.'));
  }
}

export type { WalletMemberRole };
