import type { ActivityAction, ActivityEntityType } from '#/lib/db/schema';

export type ActivityLogItemDto = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  walletAmountDelta: number | null;
  createdAt: string;
  affectsActiveStatementShare: boolean;
};

export type ActivityLogListDto = {
  items: ActivityLogItemDto[];
  total: number;
  page: number;
  pageSize: number;
};
