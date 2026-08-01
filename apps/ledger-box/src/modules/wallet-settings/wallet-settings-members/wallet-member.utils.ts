import type { WalletMemberDto } from '#/queries/wallets/wallet-member.dto';

export function hasRegisteredWalletMember(member: WalletMemberDto): boolean {
  return Boolean(member.userId && member.name);
}
