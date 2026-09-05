import { describe, expect, it } from 'vite-plus/test';

import { DateFormat, DateTimeFormat } from './constants.ts';
import {
  formatDate,
  formatDateLong,
  formatDateNumeric,
  formatDateShort,
  formatDateTime,
  formatDateTimeShort,
  formatInTimeZone,
  formatIsoDate,
  formatRelative,
  getLastMonthRange,
  getThisMonthRange,
  getThisWeekRange,
  getTodayRange,
  isDateInRange,
  isDateToday,
  isValidDate,
  toDate,
} from './utils.ts';

// Fixed UTC instant (not a local wall-clock construction) so formatting assertions are
// stable regardless of the machine's system time zone. 12:30 UTC lands at 19:30 in the
// default locale's zone (Asia/Ho_Chi_Minh, UTC+7), matching the pre-timezone-aware fixture.
const sampleDate = new Date(Date.UTC(2026, 6, 13, 12, 30));

describe('toDate', () => {
  it('returns a Date instance as-is', () => {
    expect(toDate(sampleDate)).toBe(sampleDate);
  });

  it('parses an ISO date string', () => {
    const parsed = toDate('2026-07-13');

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(13);
  });

  it('converts a timestamp number to a Date', () => {
    expect(toDate(0).getTime()).toBe(0);
  });
});

describe('formatDate', () => {
  it('formats with the default numeric pattern', () => {
    expect(formatDate(sampleDate)).toBe('13/07/2026');
  });

  it('formats with a custom pattern', () => {
    expect(formatDate(sampleDate, DateFormat.Month)).toBe('07/2026');
  });

  it('formats medium dates with locale month names', () => {
    expect(formatDate(sampleDate, DateFormat.Medium, 'en-US')).toBe('Jul 13, 2026');
    expect(formatDate(sampleDate, DateFormat.Medium, 'en-GB')).toBe('13 Jul 2026');
    expect(formatDate(sampleDate, DateFormat.MonthMedium, 'en-US')).toBe('Jul 2026');
    expect(formatDate(sampleDate, DateFormat.MonthMedium, 'ja-JP')).toBe('2026年7月');
  });
});

describe('formatDateShort', () => {
  it('formats using the short pattern', () => {
    expect(formatDateShort(sampleDate)).toBe('13/7/2026');
  });
});

describe('formatDateLong', () => {
  it('formats using the long pattern with the default locale (vi-VN)', () => {
    expect(formatDateLong(sampleDate)).toBe('13 tháng 07 2026');
  });

  it('formats using the long pattern and month-order for en-US', () => {
    expect(formatDateLong(sampleDate, 'en-US')).toBe('July 13, 2026');
  });

  it('formats using the day-first order for en-GB', () => {
    expect(formatDateLong(sampleDate, 'en-GB')).toBe('13 July 2026');
  });
});

describe('formatDateNumeric', () => {
  it('formats using the numeric pattern (default vi-VN, day-first)', () => {
    expect(formatDateNumeric(sampleDate)).toBe('13/07/2026');
  });

  it('formats month-first for en-US', () => {
    expect(formatDateNumeric(sampleDate, 'en-US')).toBe('07/13/2026');
  });

  it('formats day-first for en-GB, distinct from en-US', () => {
    expect(formatDateNumeric(sampleDate, 'en-GB')).toBe('13/07/2026');
  });

  it('formats year-first for ja-JP', () => {
    expect(formatDateNumeric(sampleDate, 'ja-JP')).toBe('2026/07/13');
  });
});

describe('formatDateTime', () => {
  it('formats with the default numeric datetime pattern', () => {
    expect(formatDateTime(sampleDate)).toBe('13/07/2026 19:30');
  });

  it('formats with a custom pattern', () => {
    expect(formatDateTime(sampleDate, DateTimeFormat.Medium)).toBe('13 thg 7 2026 19:30');
  });
});

describe('formatDateTimeShort', () => {
  it('formats using the short datetime pattern', () => {
    expect(formatDateTimeShort(sampleDate)).toBe('13/7/2026 19:30');
  });
});

describe('locale time zone conversion', () => {
  it('renders the same instant in each locale’s own time zone, not the system clock', () => {
    // 2026-07-13T12:30:00Z
    expect(formatDateTime(sampleDate, DateTimeFormat.Numeric, 'vi-VN')).toBe('13/07/2026 19:30');
    expect(formatDateTime(sampleDate, DateTimeFormat.Numeric, 'ja-JP')).toBe('2026/07/13 21:30');
    expect(formatDateTime(sampleDate, DateTimeFormat.Numeric, 'en-US')).toBe('07/13/2026 08:30');
    expect(formatDateTime(sampleDate, DateTimeFormat.Numeric, 'en-GB')).toBe('13/07/2026 13:30');
  });

  it('can shift the calendar date across midnight depending on the zone', () => {
    // 2026-07-13T23:00:00Z is already 2026-07-14 in Asia/Tokyo (UTC+9) but still 2026-07-13
    // in America/New_York (UTC-4 during EDT).
    const lateUtc = new Date(Date.UTC(2026, 6, 13, 23, 0));

    expect(formatDateNumeric(lateUtc, 'ja-JP')).toBe('2026/07/14');
    expect(formatDateNumeric(lateUtc, 'en-US')).toBe('07/13/2026');
  });
});

describe('formatInTimeZone', () => {
  it('formats an explicit timezone independent of any locale-implied zone', () => {
    // 2026-07-13T12:30:00Z: sampleDate's default vi-VN zone would render 19:30, but an
    // explicit America/New_York zone must win regardless.
    expect(formatInTimeZone(sampleDate, 'America/New_York', 'HH:mm')).toBe('08:30');
  });

  it('applies locale month names when a locale is given', () => {
    expect(formatInTimeZone(sampleDate, 'UTC', 'MMM d, yyyy', 'en-US')).toBe('Jul 13, 2026');
    expect(formatInTimeZone(sampleDate, 'UTC', 'd MMM yyyy', 'vi-VN')).toBe('13 thg 7 2026');
  });

  it('supports locale-independent machine patterns with no locale argument', () => {
    expect(formatInTimeZone(sampleDate, 'UTC', 'yyyy-MM-dd')).toBe('2026-07-13');
    expect(formatInTimeZone(sampleDate, 'UTC', 'yyyyMMddHHmm')).toBe('202607131230');
  });
});

describe('formatRelative', () => {
  it('formats a past date relative to now with a suffix (default vi-VN)', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);

    expect(formatRelative(past)).toContain('trước');
  });

  it('formats with an English suffix for en-US', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);

    expect(formatRelative(past, 'en-US')).toContain('ago');
  });
});

describe('formatIsoDate', () => {
  it('formats a date as ISO 8601', () => {
    expect(formatIsoDate(new Date(2026, 0, 1))).toContain('2026-01-01');
  });
});

describe('isValidDate', () => {
  it('returns true for a valid date', () => {
    expect(isValidDate(sampleDate)).toBe(true);
  });

  it('returns false for an invalid date string', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });
});

describe('isDateToday', () => {
  it('returns true for the current date', () => {
    expect(isDateToday(new Date())).toBe(true);
  });

  it('returns false for a date in the past', () => {
    expect(isDateToday(new Date(2000, 0, 1))).toBe(false);
  });
});

describe('isDateInRange', () => {
  it('returns true when the date falls within the range', () => {
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 6, 31) };

    expect(isDateInRange(new Date(2026, 6, 13), range)).toBe(true);
  });

  it('returns false when the date falls outside the range', () => {
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 6, 31) };

    expect(isDateInRange(new Date(2026, 7, 1), range)).toBe(false);
  });
});

describe('getTodayRange', () => {
  it('returns the start and end of the given reference date', () => {
    const { start, end } = getTodayRange(sampleDate);

    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
  });

  it('defaults to the current date when no reference date is given', () => {
    const { start, end } = getTodayRange();

    expect(start.getDate()).toBe(new Date().getDate());
    expect(end.getDate()).toBe(new Date().getDate());
  });
});

describe('getThisWeekRange', () => {
  it('returns the ISO week (Monday-Sunday) containing the reference date', () => {
    const wednesday = new Date(2026, 6, 15, 19, 30);
    const { start, end } = getThisWeekRange(wednesday);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6);
    expect(start.getDate()).toBe(13);
    expect(start.getDay()).toBe(1);
    expect(end.getDate()).toBe(19);
    expect(end.getDay()).toBe(0);
  });

  it('keeps a Sunday in the week that started the previous Monday', () => {
    const sunday = new Date(2026, 6, 12, 8, 0);
    const { start, end } = getThisWeekRange(sunday);

    expect(start.getDate()).toBe(6);
    expect(end.getDate()).toBe(12);
  });
});

describe('getThisMonthRange', () => {
  it('returns the start and end of the given month', () => {
    const { start, end } = getThisMonthRange(sampleDate);

    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(sampleDate.getMonth());
  });
});

describe('getLastMonthRange', () => {
  it('returns the start and end of the previous month', () => {
    const { start, end } = getLastMonthRange(sampleDate);

    expect(start.getMonth()).toBe(5);
    expect(end.getMonth()).toBe(5);
  });
});
