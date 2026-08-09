import axios from 'axios';

import type { ActivityLogListDto } from '#/queries/activity/activity.dto';
import type { ActivityQueryParams } from '#/queries/activity/activity.params';

export async function fetchWalletActivity(walletId: string, params: ActivityQueryParams): Promise<ActivityLogListDto> {
  const { data } = await axios.get<ActivityLogListDto>(`/api/wallets/${walletId}/activity`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      filter: params.filter,
      from: params.from,
      to: params.to,
    },
  });

  return data;
}
