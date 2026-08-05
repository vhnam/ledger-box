import axios from 'axios';

import { getApiErrorMessage } from '#/lib/api-error';
import type { WalletDto } from '#/queries/wallets/wallet.dto';
import type { TransferMoneyOutput } from '#/schemas/transfer-money.schema';
import type { CreateWalletSchema, UpdateWalletSchema } from '#/schemas/wallet.schema';

interface WalletResponseDto {
  id: string;
  name: string;
  amount: number;
  currency: string;
  role: WalletDto['role'];
}

export async function fetchWallets(): Promise<WalletDto[]> {
  const { data } = await axios.get<WalletResponseDto[]>('/api/wallets');

  return data;
}

export async function fetchWallet(walletId: string): Promise<WalletDto> {
  const wallets = await fetchWallets();
  const wallet = wallets.find((item) => item.id === walletId);

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return wallet;
}

export async function createWallet(payload: CreateWalletSchema): Promise<WalletDto> {
  const { data } = await axios.post<WalletResponseDto>('/api/wallets', payload);

  return data;
}

export async function transferMoney(payload: TransferMoneyOutput): Promise<void> {
  try {
    await axios.post('/api/wallets/transfer', payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Transfer failed. Please try again.'));
  }
}

export async function updateWallet(walletId: string, payload: UpdateWalletSchema): Promise<WalletDto> {
  try {
    const { data } = await axios.patch<WalletResponseDto>(`/api/wallets/${walletId}`, payload);

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to update wallet. Please try again.'));
  }
}

export async function deleteWallet(walletId: string): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to delete wallet. Please try again.'));
  }
}
