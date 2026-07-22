import { type ColumnType, type Generated, type Insertable, type Selectable, type Updateable } from 'kysely';

export type TransactionType = 'income' | 'expense';

export interface WalletTable {
  id: Generated<string>;
  /** v1: better-auth user id (1 user = 1 tenant). */
  tenantId: string;
  name: string;
  amount: number;
  createdAt: ColumnType<Date, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>;
  deletedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
}

export interface TransactionTable {
  id: Generated<string>;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: ColumnType<Date, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>;
  deletedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
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
