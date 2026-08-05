export type WalletAccessRole = 'owner' | 'manager' | 'viewer';

export interface WalletDto {
  id: string;
  name: string;
  amount: number;
  currency: string;
  role: WalletAccessRole;
}
