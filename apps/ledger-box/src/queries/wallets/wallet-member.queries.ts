import { useQuery } from '@tanstack/react-query';

import { fetchWalletMembers } from './wallet-member.api';

export function useWalletMembers(walletId: string) {
  return useQuery({
    queryKey: ['wallet-members', walletId],
    queryFn: () => fetchWalletMembers(walletId),
  });
}
