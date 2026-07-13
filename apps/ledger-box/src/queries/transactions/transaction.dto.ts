export type TransactionType = 'income' | 'expense';

export interface TransactionDto {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  datetime: string;
}

export interface TransactionsPageDto {
  items: TransactionDto[];
  total: number;
  page: number;
  pageSize: number;
}
