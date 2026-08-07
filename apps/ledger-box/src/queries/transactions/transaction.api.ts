import axios from 'axios';

import type { AddTransactionOutput } from '#/schemas/add-transaction.schema';
import type { EditTransactionOutput } from '#/schemas/edit-transaction.schema';

import { getApiErrorMessage } from '#/lib/api-error/api-error';

import type { UploadTransactionAttachmentsDto } from '#/queries/transactions/transaction-attachment.dto';
import type { TransactionsPageDto } from '#/queries/transactions/transaction.dto';
import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';

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
    throw new Error(getApiErrorMessage(error, 'transaction.add.errorFallback'));
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
    throw new Error(getApiErrorMessage(error, 'transaction.edit.errorFallback'));
  }
}

export async function deleteTransaction(walletId: string, transactionId: string): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}/transactions/${transactionId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'transaction.delete.errorFallback'));
  }
}

export async function uploadTransactionAttachment(
  walletId: string,
  transactionId: string,
  file: File,
): Promise<UploadTransactionAttachmentsDto> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await axios.post<UploadTransactionAttachmentsDto>(
      `/api/wallets/${walletId}/transactions/${transactionId}/attachments`,
      formData,
    );

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'attachment.upload.errorFallback'));
  }
}

export async function fetchTransactionAttachments(
  walletId: string,
  transactionId: string,
): Promise<UploadTransactionAttachmentsDto> {
  try {
    const { data } = await axios.get<UploadTransactionAttachmentsDto>(
      `/api/wallets/${walletId}/transactions/${transactionId}/attachments`,
    );

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'attachment.loadFailed'));
  }
}

export async function deleteTransactionAttachment(
  walletId: string,
  transactionId: string,
  attachmentId: string,
): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}/transactions/${transactionId}/attachments/${attachmentId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'attachment.delete.errorFallback'));
  }
}
