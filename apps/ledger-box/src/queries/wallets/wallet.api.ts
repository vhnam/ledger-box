import axios from 'axios';

import type { TransferMoneyOutput } from '#/schemas/transfer-money.schema';

import type { WalletDto } from './wallet.dto';

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

interface WalletResponseDto {
  id: string;
  name: string;
  amount: number;
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

export async function createWallet(name: string): Promise<WalletDto> {
  const { data } = await axios.post<WalletResponseDto>('/api/wallets', { name });

  return data;
}

export async function transferMoney(payload: TransferMoneyOutput): Promise<void> {
  try {
    await axios.post('/api/wallets/transfer', payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Transfer failed. Please try again.'));
  }
}
