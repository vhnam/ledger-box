export type StatementShareListDto = {
  items: StatementShareDto[];
  total: number;
  page: number;
  pageSize: number;
};

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

/** `url` is always a freshly signed, short-lived, view-only link — never a permanent one. */
export type StatementAttachmentDto = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
};

export type StatementRowDto = {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  occurredAt: string;
  runningBalance: number;
  // Server always resolves this to an array (possibly empty), including for statement shares
  // created before attachments were captured — but treat it as optional defensively, since
  // this rides on a frozen JSON blob whose shape isn't guaranteed by the type system.
  attachments?: StatementAttachmentDto[];
};

export type StatementSnapshotDto = {
  timezone: string;
  currency: string;
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
