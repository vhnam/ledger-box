import { useQuery } from '@tanstack/react-query';

import { verifyWalletInvite } from '#/queries/wallet-invites/wallet-invite.api';

export function useWalletInviteVerification(token: string) {
  return useQuery({
    queryKey: ['wallet-invite', token],
    queryFn: () => verifyWalletInvite(token),
    enabled: token.length > 0,
    retry: false,
  });
}
