import { useQuery } from '@tanstack/react-query';

import { fetchWalletMembers } from '#/queries/wallets/wallet-member.api';

export function useWalletMembers(walletId: string, page = 1) {
  return useQuery({
    queryKey: ['wallet-members', walletId, page],
    queryFn: () => fetchWalletMembers(walletId, page),
  });
}
