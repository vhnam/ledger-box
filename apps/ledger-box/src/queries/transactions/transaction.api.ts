import axios from 'axios';

import type { TransactionsPageDto } from './transaction.dto';

type FetchTransactionsParams = {
  page: number;
  pageSize: number;
};

export async function fetchTransactions(
  walletId: string,
  { page, pageSize }: FetchTransactionsParams,
): Promise<TransactionsPageDto> {
  const { data } = await axios.get<TransactionsPageDto>(`/api/wallets/${walletId}/transactions`, {
    params: { page, pageSize },
  });

  return data;
}
