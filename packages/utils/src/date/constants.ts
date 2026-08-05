import { enGB, enUS, fr, ja, vi, type Locale } from 'date-fns/locale';

import type { SupportedLocale } from '../locale/constants.ts';

export const DateFormat = {
  /** e.g. 13/07/2026 */
  Numeric: 'dd/MM/yyyy',
  /** e.g. 13/7/2026 */
  Short: 'd/M/yyyy',
  /** e.g. 13 Jul 2026 */
  Text: 'd MMM yyyy',
  /** e.g. 13 July 2026 */
  Long: 'd MMMM yyyy',
  /** e.g. 07/2026 */
  Month: 'MM/yyyy',
} as const;

export type DateFormat = (typeof DateFormat)[keyof typeof DateFormat];

export const DateTimeFormat = {
  /** e.g. 13/07/2026 19:30 */
  Numeric: 'dd/MM/yyyy HH:mm',
  /** e.g. 13/7/2026 19:30 */
  Short: 'd/M/yyyy HH:mm',
  /** e.g. 13 Jul 2026 19:30 */
  Text: 'd MMM yyyy HH:mm',
} as const;

export type DateTimeFormat = (typeof DateTimeFormat)[keyof typeof DateTimeFormat];

export const DEFAULT_DATE_FORMAT = DateFormat.Numeric;
export const DEFAULT_DATE_TIME_FORMAT = DateTimeFormat.Numeric;

/**
 * Per-locale pattern tables, keyed by the same `DateFormat`/`DateTimeFormat` keys as the
 * pattern-name-based helpers above. Region-sensitive date order (`en-US` MM/DD vs. `en-GB`
 * DD/MM) lives here — never inferred from the translated month-name locale alone.
 */
export const LOCALE_DATE_PATTERNS: Record<SupportedLocale, Record<keyof typeof DateFormat, string>> = {
  'vi-VN': {
    Numeric: 'dd/MM/yyyy',
    Short: 'd/M/yyyy',
    Text: 'd MMM yyyy',
    Long: 'd MMMM yyyy',
    Month: 'MM/yyyy',
  },
  'en-US': {
    Numeric: 'MM/dd/yyyy',
    Short: 'M/d/yyyy',
    Text: 'MMM d, yyyy',
    Long: 'MMMM d, yyyy',
    Month: 'MM/yyyy',
  },
  'en-GB': {
    Numeric: 'dd/MM/yyyy',
    Short: 'd/M/yyyy',
    Text: 'd MMM yyyy',
    Long: 'd MMMM yyyy',
    Month: 'MM/yyyy',
  },
  'ja-JP': {
    Numeric: 'yyyy/MM/dd',
    Short: 'yyyy/M/d',
    Text: "yyyy'年'M'月'd'日'",
    Long: "yyyy'年'M'月'd'日'",
    Month: 'yyyy/MM',
  },
  'fr-FR': {
    Numeric: 'dd/MM/yyyy',
    Short: 'd/M/yyyy',
    Text: 'd MMM yyyy',
    Long: 'd MMMM yyyy',
    Month: 'MM/yyyy',
  },
};

export const LOCALE_DATE_TIME_PATTERNS: Record<SupportedLocale, Record<keyof typeof DateTimeFormat, string>> = {
  'vi-VN': {
    Numeric: 'dd/MM/yyyy HH:mm',
    Short: 'd/M/yyyy HH:mm',
    Text: 'd MMM yyyy HH:mm',
  },
  'en-US': {
    Numeric: 'MM/dd/yyyy HH:mm',
    Short: 'M/d/yyyy HH:mm',
    Text: 'MMM d, yyyy HH:mm',
  },
  'en-GB': {
    Numeric: 'dd/MM/yyyy HH:mm',
    Short: 'd/M/yyyy HH:mm',
    Text: 'd MMM yyyy HH:mm',
  },
  'ja-JP': {
    Numeric: 'yyyy/MM/dd HH:mm',
    Short: 'yyyy/M/d HH:mm',
    Text: "yyyy'年'M'月'd'日' HH:mm",
  },
  'fr-FR': {
    Numeric: 'dd/MM/yyyy HH:mm',
    Short: 'd/M/yyyy HH:mm',
    Text: 'd MMM yyyy HH:mm',
  },
};

export const LOCALE_DATE_FNS_LOCALE: Record<SupportedLocale, Locale> = {
  'vi-VN': vi,
  'en-US': enUS,
  'en-GB': enGB,
  'ja-JP': ja,
  'fr-FR': fr,
};
