import axios from 'axios';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';
import type { WalletSummaryDto } from '#/queries/wallet-summary/wallet-summary.dto';

export async function fetchWalletSummary(
  walletId: string,
  { filter, from, to }: Pick<TransactionQueryParams, 'filter' | 'from' | 'to'>,
): Promise<WalletSummaryDto> {
  const { data } = await axios.get<WalletSummaryDto>(`/api/wallets/${walletId}/summary`, {
    params: { filter, from, to },
  });

  return data;
}
