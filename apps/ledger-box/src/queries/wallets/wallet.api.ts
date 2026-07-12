import axios from 'axios';

import type { WalletDto } from './wallet.dto';

interface WalletResponseDto {
  id: string;
  name: string;
}

export async function fetchWallets(): Promise<WalletDto[]> {
  const { data } = await axios.get<WalletResponseDto[]>('/api/wallets');

  return data.map((wallet) => ({
    amount: 0,
    ...wallet,
  }));
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

  return {
    amount: 0,
    ...data,
  };
}
