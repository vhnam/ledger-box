import { type ColumnType, type Generated, type Insertable, type Selectable, type Updateable } from 'kysely';

export type TransactionType = 'income' | 'expense';

export interface WalletTable {
  id: Generated<string>;
  name: string;
}

export interface TransactionTable {
  id: Generated<string>;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  datetime: ColumnType<Date, Date | string, Date | string>;
}

export interface Database {
  wallet: WalletTable;
  transaction: TransactionTable;
}

export type Wallet = Selectable<WalletTable>;
export type NewWallet = Insertable<WalletTable>;
export type WalletUpdate = Updateable<WalletTable>;

export type Transaction = Selectable<TransactionTable>;
export type NewTransaction = Insertable<TransactionTable>;
export type TransactionUpdate = Updateable<TransactionTable>;
