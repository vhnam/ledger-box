import type { WalletMemberRole } from '#/constants/wallet-member-role-options';

export type WalletInviteVerificationDto = {
  walletId: string;
  walletName: string;
  role: WalletMemberRole;
  requiresSignIn: boolean;
};
