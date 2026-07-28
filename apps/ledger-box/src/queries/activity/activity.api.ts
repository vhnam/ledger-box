import axios from 'axios';

import type { ActivityLogListDto } from '#/queries/activity/activity.dto';

export async function fetchWalletActivity(walletId: string, page = 1, pageSize = 20): Promise<ActivityLogListDto> {
  const { data } = await axios.get<ActivityLogListDto>(`/api/wallets/${walletId}/activity`, {
    params: { page, pageSize },
  });

  return data;
}
