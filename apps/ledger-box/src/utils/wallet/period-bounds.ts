import { formatInTimeZone } from '@vhnam/utils/date';
import type { SupportedLocale } from '@vhnam/utils/locale';

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

type ZonedTimeParts = { hour: number; minute: number; second: number };

function getZonedTimeParts(date: Date, timeZone: string): ZonedTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
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

  return { hour, minute: Number(map.minute), second: Number(map.second) };
}

function parseHhMm(value: string): { hour: number; minute: number; second: number } {
  const [hour, minute] = value.split(':').map(Number);

  return { hour, minute, second: 0 };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Reads a UTC instant as calendar-date (`yyyy-MM-dd`) and clock-time (`HH:mm`) strings in
 * `timezone` — the inverse of {@link resolveEditedOccurredAt}. Client-safe (no server-only
 * imports); used to pre-fill a date/time picker pair from a stored instant.
 */
export function toZonedDateAndTimeStrings(instant: Date, timezone: string): { date: string; time: string } {
  const { year, month, day } = getZonedDateParts(instant, timezone);
  const { hour, minute } = getZonedTimeParts(instant, timezone);

  return { date: `${year}-${pad(month)}-${pad(day)}`, time: `${pad(hour)}:${pad(minute)}` };
}

/**
 * Resolves the occurred-at instant for an edit. `datePart` (`yyyy-MM-dd`) and `timePart`
 * (`HH:mm`) are each optional and independently fall back to the corresponding wall-clock
 * component of `referenceInstant` (the record's current occurredAt, read in `timezone`) —
 * editing only the date preserves the existing time and vice versa, since the date and time
 * pickers can be edited independently and neither implies a change to the other.
 */
export function resolveEditedOccurredAt(
  timezone: string,
  referenceInstant: Date,
  datePart?: string,
  timePart?: string,
): Date {
  const { year, month, day } = datePart ? parseYyyyMmDd(datePart) : getZonedDateParts(referenceInstant, timezone);
  const { hour, minute, second } = timePart ? parseHhMm(timePart) : getZonedTimeParts(referenceInstant, timezone);

  return zonedWallTimeToUtc(year, month - 1, day, hour, minute, second, timezone);
}

function dayBounds(parts: ZonedDateParts, timezone: string): PeriodBounds {
  return {
    start: startOfDayUtc(parts, timezone),
    endExclusive: startOfDayUtc(addDaysToParts(parts, 1), timezone),
  };
}

/** ISO weekday for a calendar Y-M-D: 1 = Monday … 7 = Sunday. */
function getIsoWeekday(parts: ZonedDateParts): number {
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();

  return day === 0 ? 7 : day;
}

/** Monday (ISO week start) of the week containing `parts`. */
function mondayOfWeek(parts: ZonedDateParts): ZonedDateParts {
  return addDaysToParts(parts, 1 - getIsoWeekday(parts));
}

function weekBoundsFromMonday(monday: ZonedDateParts, timezone: string): PeriodBounds {
  return {
    start: startOfDayUtc(monday, timezone),
    endExclusive: startOfDayUtc(addDaysToParts(monday, 7), timezone),
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
    case FILTER_OPTIONS.THIS_WEEK: {
      const monday = mondayOfWeek(getZonedDateParts(referenceNow, timezone));

      return weekBoundsFromMonday(monday, timezone);
    }
    case FILTER_OPTIONS.LAST_WEEK: {
      const thisMonday = mondayOfWeek(getZonedDateParts(referenceNow, timezone));
      const lastMonday = addDaysToParts(thisMonday, -7);

      return weekBoundsFromMonday(lastMonday, timezone);
    }
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

/** Formats a UTC instant as a calendar date/time string in `timezone`, for the given viewer `locale`. */
export function formatDateInTimezone(
  date: Date,
  timezone: string,
  locale: SupportedLocale = 'en-US',
  pattern: string = 'MMM d, yyyy',
): string {
  return formatInTimeZone(date, timezone, pattern, locale);
}

export type { PeriodBounds };
