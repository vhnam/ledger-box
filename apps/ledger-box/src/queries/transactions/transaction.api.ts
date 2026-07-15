import axios from 'axios';

import type { TransactionsPageDto } from './transaction.dto';
import type { TransactionQueryParams } from './transaction.params';

export async function fetchTransactions(
  walletId: string,
  { page, pageSize, filter, from, to, sortBy, sortOrder }: TransactionQueryParams,
): Promise<TransactionsPageDto> {
  const { data } = await axios.get<TransactionsPageDto>(`/api/wallets/${walletId}/transactions`, {
    params: {
      page,
      pageSize,
      filter,
      from,
      to,
      sortBy,
      sortOrder,
    },
  });

  return data;
}
