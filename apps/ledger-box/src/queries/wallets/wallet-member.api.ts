import axios from 'axios';

import type { WalletMemberRole } from '#/constants/wallet-member-role-options';
import type { InviteWalletMemberSchema, UpdateWalletMemberRoleSchema } from '#/schemas/wallet-member.schema';

import type { WalletMemberDto } from './wallet-member.dto';

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.length > 0) {
      return data;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function fetchWalletMembers(walletId: string): Promise<WalletMemberDto[]> {
  const { data } = await axios.get<WalletMemberDto[]>(`/api/wallets/${walletId}/members`);

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

export type { WalletMemberRole };
