import { type ColumnType, type Generated, type Insertable, type Selectable, type Updateable } from 'kysely';

export type TransactionType = 'income' | 'expense';
export type WalletMemberRole = 'viewer' | 'manager';
export type WalletMemberStatus = 'active' | 'pending';
export type ActivityEntityType = 'transaction' | 'wallet' | 'wallet_member' | 'statement_share' | 'transfer';
export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'transfer'
  | 'invite'
  | 'role_change'
  | 'revoke'
  | 'rename'
  | 'invite_resend'
  | 'invite_email_failed';

export interface WalletTable {
  id: Generated<string>;
  /** v1: better-auth user id (1 user = 1 tenant). */
  tenantId: string;
  name: string;
  amount: number;
  currency: Generated<string>;
  /** IANA timezone name; authoritative zone for all calendar-day/month period boundaries. */
  timezone: Generated<string>;
  createdAt: ColumnType<Date, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>;
  deletedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
  inviteRateWindowStart: ColumnType<Date | null, Date | string | null, Date | string | null>;
  inviteRateWindowCount: Generated<number>;
}

export interface WalletMemberTable {
  id: Generated<string>;
  walletId: string;
  email: string;
  userId: string | null;
  role: WalletMemberRole;
  status: WalletMemberStatus;
  createdAt: ColumnType<Date, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>;
  deletedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
  inviteTokenHash: string | null;
  inviteTokenExpiresAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
  lastInvitedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
  inviteSendCount: Generated<number>;
}

export interface TransactionTable {
  id: Generated<string>;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  /** User-editable event date; the sole period boundary for filters, summaries, and statements. */
  occurredAt: ColumnType<Date, Date | string, Date | string>;
  createdAt: ColumnType<Date, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>;
  deletedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
}

export interface WalletStatementShareTable {
  id: Generated<string>;
  walletId: string;
  tenantId: string;
  periodFrom: ColumnType<Date, Date | string, Date | string>;
  periodTo: ColumnType<Date, Date | string, Date | string>;
  tokenHash: string;
  displayTitle: string | null;
  expiresAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
  revokedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
  /** Frozen `StatementSnapshot` payload; the public endpoint serves this, never recomputes. */
  snapshotJson: ColumnType<unknown, unknown, unknown>;
  snapshotAt: ColumnType<Date, Date | string, Date | string>;
  accessCount: Generated<number>;
  lastAccessedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;
  rateWindowStart: ColumnType<Date | null, Date | string | null, Date | string | null>;
  rateWindowCount: Generated<number>;
  createdAt: Generated<ColumnType<Date, Date | string, Date | string>>;
}

export interface UserSettingsTable {
  id: Generated<string>;
  tenantId: string;
  locale: string;
  createdAt: ColumnType<Date, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>;
}

export interface WalletActivityLogTable {
  id: Generated<string>;
  walletId: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  beforeJson: ColumnType<
    Record<string, unknown> | null,
    Record<string, unknown> | null,
    Record<string, unknown> | null
  >;
  afterJson: ColumnType<Record<string, unknown> | null, Record<string, unknown> | null, Record<string, unknown> | null>;
  walletAmountDelta: number | null;
  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export interface Database {
  wallet: WalletTable;
  walletMember: WalletMemberTable;
  transaction: TransactionTable;
  walletStatementShare: WalletStatementShareTable;
  walletActivityLog: WalletActivityLogTable;
  userSettings: UserSettingsTable;
}

export type Wallet = Selectable<WalletTable>;
export type NewWallet = Insertable<WalletTable>;
export type WalletUpdate = Updateable<WalletTable>;

export type WalletMember = Selectable<WalletMemberTable>;
export type NewWalletMember = Insertable<WalletMemberTable>;
export type WalletMemberUpdate = Updateable<WalletMemberTable>;

export type Transaction = Selectable<TransactionTable>;
export type NewTransaction = Insertable<TransactionTable>;
export type TransactionUpdate = Updateable<TransactionTable>;

export type WalletStatementShare = Selectable<WalletStatementShareTable>;
export type NewWalletStatementShare = Insertable<WalletStatementShareTable>;
export type WalletStatementShareUpdate = Updateable<WalletStatementShareTable>;

export type WalletActivityLog = Selectable<WalletActivityLogTable>;
export type NewWalletActivityLog = Insertable<WalletActivityLogTable>;

export type UserSettings = Selectable<UserSettingsTable>;
export type NewUserSettings = Insertable<UserSettingsTable>;
export type UserSettingsUpdate = Updateable<UserSettingsTable>;
