export type StatementShareDto = {
  id: string;
  periodFrom: string;
  periodTo: string;
  displayTitle: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  snapshotAt: string;
  accessCount: number;
  lastAccessedAt: string | null;
  isActive: boolean;
};

export type StatementRowDto = {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  occurredAt: string;
  runningBalance: number;
};

export type StatementSnapshotDto = {
  timezone: string;
  periodFrom: string | null;
  periodTo: string | null;
  snapshotAt: string;
  openingBalance: number;
  closingBalance: number;
  totalIn: number;
  totalOut: number;
  rows: StatementRowDto[];
};

export type CreateStatementSharePayload = {
  periodFrom: string;
  periodTo: string;
  displayTitle?: string;
  expiresAt?: string | null;
};

export type CreateStatementShareResponse = {
  shareId: string;
  token: string;
  publicUrl: string;
};

export type PreviewStatementShareResponse = {
  preview: StatementSnapshotDto;
};

export type PublicStatementResponse = {
  displayTitle: string | null;
  snapshot: StatementSnapshotDto;
};
