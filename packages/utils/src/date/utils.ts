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

import { DEFAULT_CURRENCY_LOCALE } from '../currency/constants.ts';
import type { SupportedLocale } from '../locale/constants.ts';
import {
  DateFormat,
  DateTimeFormat,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  LOCALE_DATE_FNS_LOCALE,
  LOCALE_DATE_PATTERNS,
  LOCALE_DATE_TIME_PATTERNS,
} from './constants.ts';
import type { DateInput, DateRange } from './types.ts';

/**
 * Backward-compatible default for every `formatDate*`/`formatDateTime*`/`formatRelative`
 * function below — matches the currency formatter's existing `vi-VN` default so any
 * as-yet-unmigrated call site keeps rendering exactly as it did before locale support was
 * added. Distinct from `@vhnam/utils/locale`'s `DEFAULT_LOCALE` (`en-US`), which is the
 * Accept-Language *detection* fallback, not a display default.
 */
const DEFAULT_DATE_LOCALE: SupportedLocale = DEFAULT_CURRENCY_LOCALE as SupportedLocale;

export function toDate(date: DateInput): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === 'string') {
    return parseISO(date);
  }

  return new Date(date);
}

function resolvePattern(patternKey: DateFormat, locale: SupportedLocale): string {
  const key = (Object.keys(DateFormat) as (keyof typeof DateFormat)[]).find((name) => DateFormat[name] === patternKey);

  return key ? LOCALE_DATE_PATTERNS[locale][key] : patternKey;
}

function resolveDateTimePattern(patternKey: DateTimeFormat, locale: SupportedLocale): string {
  const key = (Object.keys(DateTimeFormat) as (keyof typeof DateTimeFormat)[]).find(
    (name) => DateTimeFormat[name] === patternKey,
  );

  return key ? LOCALE_DATE_TIME_PATTERNS[locale][key] : patternKey;
}

export function formatDate(
  date: DateInput,
  pattern: DateFormat = DEFAULT_DATE_FORMAT,
  locale: SupportedLocale = DEFAULT_DATE_LOCALE,
): string {
  return format(toDate(date), resolvePattern(pattern, locale), { locale: LOCALE_DATE_FNS_LOCALE[locale] });
}

export function formatDateShort(date: DateInput, locale: SupportedLocale = DEFAULT_DATE_LOCALE): string {
  return formatDate(date, DateFormat.Short, locale);
}

export function formatDateLong(date: DateInput, locale: SupportedLocale = DEFAULT_DATE_LOCALE): string {
  return formatDate(date, DateFormat.Long, locale);
}

export function formatDateNumeric(date: DateInput, locale: SupportedLocale = DEFAULT_DATE_LOCALE): string {
  return formatDate(date, DateFormat.Numeric, locale);
}

export function formatDateTime(
  date: DateInput,
  pattern: DateTimeFormat = DEFAULT_DATE_TIME_FORMAT,
  locale: SupportedLocale = DEFAULT_DATE_LOCALE,
): string {
  return format(toDate(date), resolveDateTimePattern(pattern, locale), { locale: LOCALE_DATE_FNS_LOCALE[locale] });
}

export function formatDateTimeShort(date: DateInput, locale: SupportedLocale = DEFAULT_DATE_LOCALE): string {
  return formatDateTime(date, DateTimeFormat.Short, locale);
}

export function formatRelative(date: DateInput, locale: SupportedLocale = DEFAULT_DATE_LOCALE): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true, locale: LOCALE_DATE_FNS_LOCALE[locale] });
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
