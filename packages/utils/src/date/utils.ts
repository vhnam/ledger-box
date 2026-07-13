import {
  endOfDay,
  endOfMonth,
  format,
  formatDistanceToNow,
  formatISO,
  isToday,
  isValid,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';

import { DateFormat, DateTimeFormat, DEFAULT_DATE_FORMAT, DEFAULT_DATE_TIME_FORMAT } from './constants.ts';
import type { DateInput, DateRange } from './types.ts';

export function toDate(date: DateInput): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === 'string') {
    return parseISO(date);
  }

  return new Date(date);
}

export function formatDate(date: DateInput, pattern: DateFormat = DEFAULT_DATE_FORMAT): string {
  return format(toDate(date), pattern);
}

export function formatDateShort(date: DateInput): string {
  return formatDate(date, DateFormat.Short);
}

export function formatDateLong(date: DateInput): string {
  return formatDate(date, DateFormat.Long);
}

export function formatDateNumeric(date: DateInput): string {
  return formatDate(date, DateFormat.Numeric);
}

export function formatDateTime(date: DateInput, pattern: DateTimeFormat = DEFAULT_DATE_TIME_FORMAT): string {
  return format(toDate(date), pattern);
}

export function formatDateTimeShort(date: DateInput): string {
  return formatDateTime(date, DateTimeFormat.Short);
}

export function formatRelative(date: DateInput): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true });
}

export function formatIsoDate(date: DateInput): string {
  return formatISO(toDate(date));
}

export function isValidDate(date: DateInput): boolean {
  return isValid(toDate(date));
}

export function isDateToday(date: DateInput): boolean {
  return isToday(toDate(date));
}

export function isDateInRange(date: DateInput, range: DateRange): boolean {
  return isWithinInterval(toDate(date), range);
}

export function getTodayRange(referenceDate: DateInput = new Date()): DateRange {
  const date = toDate(referenceDate);

  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

export function getThisMonthRange(referenceDate: DateInput = new Date()): DateRange {
  const date = toDate(referenceDate);

  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getLastMonthRange(referenceDate: DateInput = new Date()): DateRange {
  const date = subMonths(toDate(referenceDate), 1);

  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}
