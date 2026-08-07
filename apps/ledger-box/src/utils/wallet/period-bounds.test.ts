import { describe, expect, it } from 'vite-plus/test';

import { FILTER_OPTIONS } from '#/constants/filter-options';

import { calendarDateToOccurredAtStart, formatDateInTimezone, resolvePeriodBounds } from './period-bounds';

describe('calendarDateToOccurredAtStart', () => {
  it('returns the UTC instant for local midnight in the given timezone', () => {
    const date = calendarDateToOccurredAtStart('Asia/Ho_Chi_Minh', '2026-08-08');

    // Asia/Ho_Chi_Minh is UTC+7, so local midnight is the previous day at 17:00 UTC.
    expect(date.toISOString()).toBe('2026-08-07T17:00:00.000Z');
  });

  it('handles UTC directly', () => {
    const date = calendarDateToOccurredAtStart('UTC', '2026-01-01');

    expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('resolvePeriodBounds', () => {
  const referenceNow = new Date('2026-08-08T12:00:00.000Z');

  it('returns null for all-time and unknown filters', () => {
    expect(resolvePeriodBounds('UTC', FILTER_OPTIONS.ALL_TIME, undefined, undefined, referenceNow)).toBeNull();
    expect(resolvePeriodBounds('UTC', 'unknown-filter', undefined, undefined, referenceNow)).toBeNull();
  });

  it('resolves a half-open day range for "today"', () => {
    const bounds = resolvePeriodBounds('UTC', FILTER_OPTIONS.TODAY, undefined, undefined, referenceNow);

    expect(bounds).toEqual({
      start: new Date('2026-08-08T00:00:00.000Z'),
      endExclusive: new Date('2026-08-09T00:00:00.000Z'),
    });
  });

  it('resolves a half-open month range for "this-month"', () => {
    const bounds = resolvePeriodBounds('UTC', FILTER_OPTIONS.THIS_MONTH, undefined, undefined, referenceNow);

    expect(bounds).toEqual({
      start: new Date('2026-08-01T00:00:00.000Z'),
      endExclusive: new Date('2026-09-01T00:00:00.000Z'),
    });
  });

  it('resolves "last-month", rolling back across a year boundary in January', () => {
    const january = new Date('2026-01-15T12:00:00.000Z');

    expect(resolvePeriodBounds('UTC', FILTER_OPTIONS.LAST_MONTH, undefined, undefined, january)).toEqual({
      start: new Date('2025-12-01T00:00:00.000Z'),
      endExclusive: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('resolves an explicit inclusive date-range as a half-open range', () => {
    const bounds = resolvePeriodBounds('UTC', FILTER_OPTIONS.DATE_RANGE, '2026-08-01', '2026-08-03', referenceNow);

    expect(bounds).toEqual({
      start: new Date('2026-08-01T00:00:00.000Z'),
      endExclusive: new Date('2026-08-04T00:00:00.000Z'),
    });
  });

  it('returns null for date-range when from/to are missing', () => {
    expect(resolvePeriodBounds('UTC', FILTER_OPTIONS.DATE_RANGE, undefined, undefined, referenceNow)).toBeNull();
  });
});

describe('formatDateInTimezone', () => {
  it('formats a UTC instant as a calendar date in the given timezone/locale', () => {
    const formatted = formatDateInTimezone(new Date('2026-08-08T12:00:00.000Z'), 'UTC', 'en-US');

    expect(formatted).toBe('Aug 8, 2026');
  });
});
