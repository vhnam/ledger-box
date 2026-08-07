import { calendarDateToOccurredAtStart } from '#/utils/wallet/period-bounds.ts';

type ShareForOverlap = {
  periodFrom: Date | string;
  periodTo: Date | string;
  snapshotAt: Date | string;
  revokedAt: Date | string | null;
  expiresAt: Date | string | null;
};

type ActivityForOverlap = {
  createdAt: Date | string;
  beforeJson: unknown;
  afterJson: unknown;
};

function isActiveShare(share: ShareForOverlap): boolean {
  if (share.revokedAt) {
    return false;
  }

  if (!share.expiresAt) {
    return true;
  }

  return new Date(share.expiresAt).getTime() > Date.now();
}

function toYyyyMmDd(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function readOccurredAt(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const occurredAt = (payload as { occurredAt?: unknown }).occurredAt;

  return typeof occurredAt === 'string' ? occurredAt : null;
}

function resolveLogOccurredAt(log: ActivityForOverlap): Date | null {
  const fromAfter = readOccurredAt(log.afterJson);
  const fromBefore = readOccurredAt(log.beforeJson);
  const iso = fromAfter ?? fromBefore;

  if (!iso) {
    return null;
  }

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : date;
}

function activityAffectsActiveShare(log: ActivityForOverlap, shares: ShareForOverlap[], timezone: string): boolean {
  const occurredAt = resolveLogOccurredAt(log);

  if (!occurredAt) {
    return false;
  }

  const logCreatedAt = new Date(log.createdAt).getTime();

  return shares.some((share) => {
    if (!isActiveShare(share)) {
      return false;
    }

    if (new Date(share.snapshotAt).getTime() >= logCreatedAt) {
      return false;
    }

    const periodFrom = toYyyyMmDd(share.periodFrom);
    const periodTo = toYyyyMmDd(share.periodTo);
    const start = calendarDateToOccurredAtStart(timezone, periodFrom);
    const endExclusive = new Date(calendarDateToOccurredAtStart(timezone, periodTo).getTime() + 24 * 60 * 60 * 1000);

    return occurredAt >= start && occurredAt < endExclusive;
  });
}

export { activityAffectsActiveShare, isActiveShare };
