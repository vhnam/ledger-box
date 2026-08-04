import { describe, expect, it } from 'vite-plus/test';

import { DateFormat, DateTimeFormat } from './constants.ts';
import {
  formatDate,
  formatDateLong,
  formatDateNumeric,
  formatDateShort,
  formatDateTime,
  formatDateTimeShort,
  formatIsoDate,
  formatRelative,
  getLastMonthRange,
  getThisMonthRange,
  getTodayRange,
  isDateInRange,
  isDateToday,
  isValidDate,
  toDate,
} from './utils.ts';

const sampleDate = new Date(2026, 6, 13, 19, 30);

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
});

describe('formatDateShort', () => {
  it('formats using the short pattern', () => {
    expect(formatDateShort(sampleDate)).toBe('13/7/2026');
  });
});

describe('formatDateLong', () => {
  it('formats using the long pattern', () => {
    expect(formatDateLong(sampleDate)).toBe('13 July 2026');
  });
});

describe('formatDateNumeric', () => {
  it('formats using the numeric pattern', () => {
    expect(formatDateNumeric(sampleDate)).toBe('13/07/2026');
  });
});

describe('formatDateTime', () => {
  it('formats with the default numeric datetime pattern', () => {
    expect(formatDateTime(sampleDate)).toBe('13/07/2026 19:30');
  });

  it('formats with a custom pattern', () => {
    expect(formatDateTime(sampleDate, DateTimeFormat.Text)).toBe('13 Jul 2026 19:30');
  });
});

describe('formatDateTimeShort', () => {
  it('formats using the short datetime pattern', () => {
    expect(formatDateTimeShort(sampleDate)).toBe('13/7/2026 19:30');
  });
});

describe('formatRelative', () => {
  it('formats a past date relative to now with a suffix', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);

    expect(formatRelative(past)).toContain('ago');
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
