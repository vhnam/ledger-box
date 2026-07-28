import { useQuery } from '@tanstack/react-query';

import { fetchWalletActivity } from '#/queries/activity/activity.api';

export function useWalletActivity(walletId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['activity', walletId, page],
    queryFn: () => fetchWalletActivity(walletId, page),
    enabled: enabled && walletId.length > 0,
  });
}
