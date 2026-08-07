import axios from 'axios';

import type { TransferMoneyOutput } from '#/schemas/transfer-money.schema';
import type { CreateWalletSchema, UpdateWalletSchema } from '#/schemas/wallet.schema';

import { getApiErrorMessage } from '#/lib/api-error';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

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
    throw new Error('errors.WALLET_NOT_FOUND');
  }

  return wallet;
}

export async function createWallet(payload: CreateWalletSchema): Promise<WalletDto> {
  try {
    const { data } = await axios.post<WalletResponseDto>('/api/wallets', payload);

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'errors.WALLET_NAME_REQUIRED'));
  }
}

export async function transferMoney(payload: TransferMoneyOutput): Promise<void> {
  try {
    await axios.post('/api/wallets/transfer', payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'transfer.errorFallback'));
  }
}

export async function updateWallet(walletId: string, payload: UpdateWalletSchema): Promise<WalletDto> {
  try {
    const { data } = await axios.patch<WalletResponseDto>(`/api/wallets/${walletId}`, payload);

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'wallet.settings.general.updateErrorFallback'));
  }
}

export async function deleteWallet(walletId: string): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'wallet.delete.errorFallback'));
  }
}
