import type { WalletMemberRole } from '#/constants/wallet-member-role-options';

export type WalletMemberStatus = 'active' | 'pending';

export type WalletMemberDto = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  userId?: string;
  role: WalletMemberRole;
  status: WalletMemberStatus;
  isOwner: boolean;
  emailSent?: boolean;
  lastInvitedAt?: string;
};

export type WalletMemberListDto = {
  items: WalletMemberDto[];
  total: number;
  page: number;
  pageSize: number;
};
