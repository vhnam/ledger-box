import { useQuery } from '@tanstack/react-query';

import { fetchWallet, fetchWallets } from './wallet.api';

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });
}

export function useWallet(walletId: string) {
  return useQuery({
    queryKey: ['wallet', walletId],
    queryFn: () => fetchWallet(walletId),
  });
}
