import { FILTER_OPTIONS } from '#/constants/filter-options';

type PeriodBounds = {
  start: Date;
  endExclusive: Date;
};

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
};

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    map[part.type] = part.value;
  }

  const hour = map.hour === '24' ? 0 : Number(map.hour);
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  );

  return asUtc - date.getTime();
}

/** Converts a wall-clock date/time in `timeZone` to the equivalent UTC instant. */
function zonedWallTimeToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const asUtcGuess = Date.UTC(year, monthIndex, day, hour, minute, second);
  const offsetMs = getTimeZoneOffsetMs(new Date(asUtcGuess), timeZone);

  return new Date(asUtcGuess - offsetMs);
}

function getZonedDateParts(date: Date, timeZone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    map[part.type] = part.value;
  }

  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

function parseYyyyMmDd(value: string): ZonedDateParts {
  const [year, month, day] = value.split('-').map(Number);

  return { year, month, day };
}

function addDaysToParts(parts: ZonedDateParts, days: number): ZonedDateParts {
  const utcMidnight = Date.UTC(parts.year, parts.month - 1, parts.day);
  const shifted = new Date(utcMidnight + days * 24 * 60 * 60 * 1000);

  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

function startOfDayUtc(parts: ZonedDateParts, timeZone: string): Date {
  return zonedWallTimeToUtc(parts.year, parts.month - 1, parts.day, 0, 0, 0, timeZone);
}

/** Start-of-day instant, in `timezone`, for a `yyyy-MM-dd` calendar date. */
export function calendarDateToOccurredAtStart(timezone: string, yyyyMmDd: string): Date {
  return startOfDayUtc(parseYyyyMmDd(yyyyMmDd), timezone);
}

function dayBounds(parts: ZonedDateParts, timezone: string): PeriodBounds {
  return {
    start: startOfDayUtc(parts, timezone),
    endExclusive: startOfDayUtc(addDaysToParts(parts, 1), timezone),
  };
}

function monthBounds(parts: ZonedDateParts, timezone: string): PeriodBounds {
  const start = zonedWallTimeToUtc(parts.year, parts.month - 1, 1, 0, 0, 0, timezone);
  const nextMonth =
    parts.month === 12 ? { year: parts.year + 1, month: 1 } : { year: parts.year, month: parts.month + 1 };
  const endExclusive = zonedWallTimeToUtc(nextMonth.year, nextMonth.month - 1, 1, 0, 0, 0, timezone);

  return { start, endExclusive };
}

/**
 * Resolves a filter preset or explicit calendar range to UTC instant bounds, in `timezone`.
 * Returns `null` for `all-time` (no period predicate). Bounds are half-open: callers must
 * query `occurred_at >= start AND occurred_at < endExclusive`, never `<=`.
 */
export function resolvePeriodBounds(
  timezone: string,
  filter: string,
  from?: string,
  to?: string,
  referenceNow: Date = new Date(),
): PeriodBounds | null {
  switch (filter) {
    case FILTER_OPTIONS.TODAY:
      return dayBounds(getZonedDateParts(referenceNow, timezone), timezone);
    case FILTER_OPTIONS.THIS_MONTH:
      return monthBounds(getZonedDateParts(referenceNow, timezone), timezone);
    case FILTER_OPTIONS.LAST_MONTH: {
      const current = getZonedDateParts(referenceNow, timezone);
      const lastMonth =
        current.month === 1
          ? { year: current.year - 1, month: 12, day: 1 }
          : { year: current.year, month: current.month - 1, day: 1 };

      return monthBounds(lastMonth, timezone);
    }
    case FILTER_OPTIONS.DATE_RANGE: {
      if (!from || !to) {
        return null;
      }

      const fromParts = parseYyyyMmDd(from);
      const toParts = parseYyyyMmDd(to);

      return {
        start: startOfDayUtc(fromParts, timezone),
        endExclusive: startOfDayUtc(addDaysToParts(toParts, 1), timezone),
      };
    }
    default:
      return null;
  }
}

/** Formats a UTC instant as a calendar date/time string in `timezone`. */
export function formatDateInTimezone(
  date: Date,
  timezone: string,
  pattern: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  return new Intl.DateTimeFormat('en-US', { ...pattern, timeZone: timezone }).format(date);
}

export type { PeriodBounds };
