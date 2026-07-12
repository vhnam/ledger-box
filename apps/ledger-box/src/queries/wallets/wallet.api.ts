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

export async function createWallet(name: string): Promise<WalletDto> {
  const { data } = await axios.post<WalletResponseDto>('/api/wallets', { name });

  return {
    amount: 0,
    ...data,
  };
}
