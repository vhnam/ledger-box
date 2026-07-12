import { useQuery } from '@tanstack/react-query';

import { fetchWallets } from './wallet.api';

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });
}
