import axios from 'axios';

import type { AddTransactionOutput } from '#/schemas/add-transaction.schema';
import type { EditTransactionOutput } from '#/schemas/edit-transaction.schema';

import type { TransactionsPageDto } from './transaction.dto';
import type { TransactionQueryParams } from './transaction.params';

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.length > 0) {
      return data;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

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

export async function addTransaction(walletId: string, payload: AddTransactionOutput): Promise<void> {
  try {
    await axios.post(`/api/wallets/${walletId}/transactions`, payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to add transaction. Please try again.'));
  }
}

export async function updateTransaction(
  walletId: string,
  transactionId: string,
  payload: EditTransactionOutput,
): Promise<void> {
  try {
    await axios.patch(`/api/wallets/${walletId}/transactions/${transactionId}`, payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to update transaction. Please try again.'));
  }
}

export async function deleteTransaction(walletId: string, transactionId: string): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}/transactions/${transactionId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to delete transaction. Please try again.'));
  }
}
