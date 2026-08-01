import axios from 'axios';

import type { WalletInviteVerificationDto } from '#/queries/wallet-invites/wallet-invite.dto';

export async function verifyWalletInvite(token: string): Promise<WalletInviteVerificationDto> {
  const { data } = await axios.get<WalletInviteVerificationDto>(`/api/wallets/invites/${token}`);

  return data;
}
