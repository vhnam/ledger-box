import { useQuery } from '@tanstack/react-query';

import { fetchWalletActivity } from '#/queries/activity/activity.api';
import type { ActivityQueryParams } from '#/queries/activity/activity.params';

export function useWalletActivity(walletId: string, params: ActivityQueryParams, enabled = true) {
  const { page, pageSize, filter, from, to } = params;

  return useQuery({
    queryKey: ['activity', walletId, page, pageSize, filter, from, to],
    queryFn: () => fetchWalletActivity(walletId, params),
    enabled: enabled && walletId.length > 0,
  });
}
