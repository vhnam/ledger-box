import { enGB, enUS, fr, ja, vi, zhCN, zhTW, type Locale } from 'date-fns/locale';

import type { SupportedLocale } from '../locale/constants.ts';

export const DateFormat = {
  /** e.g. 13/07/2026 */
  Numeric: 'dd/MM/yyyy',
  /** e.g. 13/7/2026 */
  Short: 'd/M/yyyy',
  /** e.g. 13 Jul 2026 */
  Medium: 'd MMM yyyy',
  /** e.g. 13 July 2026 */
  Long: 'd MMMM yyyy',
  /** e.g. 07/2026 */
  Month: 'MM/yyyy',
  /** e.g. Jul 2026 */
  MonthMedium: 'MMM yyyy',
} as const;

export type DateFormat = (typeof DateFormat)[keyof typeof DateFormat];

export const DateTimeFormat = {
  /** e.g. 13/07/2026 19:30 */
  Numeric: 'dd/MM/yyyy HH:mm',
  /** e.g. 13/7/2026 19:30 */
  Short: 'd/M/yyyy HH:mm',
  /** e.g. 13 Jul 2026 19:30 */
  Medium: 'd MMM yyyy HH:mm',
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
    Medium: 'd MMM yyyy',
    Long: 'd MMMM yyyy',
    Month: 'MM/yyyy',
    MonthMedium: 'MMM yyyy',
  },
  'en-US': {
    Numeric: 'MM/dd/yyyy',
    Short: 'M/d/yyyy',
    Medium: 'MMM d, yyyy',
    Long: 'MMMM d, yyyy',
    Month: 'MM/yyyy',
    MonthMedium: 'MMM yyyy',
  },
  'en-GB': {
    Numeric: 'dd/MM/yyyy',
    Short: 'd/M/yyyy',
    Medium: 'd MMM yyyy',
    Long: 'd MMMM yyyy',
    Month: 'MM/yyyy',
    MonthMedium: 'MMM yyyy',
  },
  'ja-JP': {
    Numeric: 'yyyy/MM/dd',
    Short: 'yyyy/M/d',
    Medium: "yyyy'年'M'月'd'日'",
    Long: "yyyy'年'M'月'd'日'",
    Month: 'yyyy/MM',
    MonthMedium: "yyyy'年'M'月'",
  },
  'fr-FR': {
    Numeric: 'dd/MM/yyyy',
    Short: 'd/M/yyyy',
    Medium: 'd MMM yyyy',
    Long: 'd MMMM yyyy',
    Month: 'MM/yyyy',
    MonthMedium: 'MMM yyyy',
  },
  'zh-CN': {
    Numeric: 'yyyy/MM/dd',
    Short: 'yyyy/M/d',
    Medium: "yyyy'年'M'月'd'日'",
    Long: "yyyy'年'M'月'd'日'",
    Month: 'yyyy/MM',
    MonthMedium: "yyyy'年'M'月'",
  },
  'zh-TW': {
    Numeric: 'yyyy/MM/dd',
    Short: 'yyyy/M/d',
    Medium: "yyyy'年'M'月'd'日'",
    Long: "yyyy'年'M'月'd'日'",
    Month: 'yyyy/MM',
    MonthMedium: "yyyy'年'M'月'",
  },
};

export const LOCALE_DATE_TIME_PATTERNS: Record<SupportedLocale, Record<keyof typeof DateTimeFormat, string>> = {
  'vi-VN': {
    Numeric: 'dd/MM/yyyy HH:mm',
    Short: 'd/M/yyyy HH:mm',
    Medium: 'd MMM yyyy HH:mm',
  },
  'en-US': {
    Numeric: 'MM/dd/yyyy HH:mm',
    Short: 'M/d/yyyy HH:mm',
    Medium: 'MMM d, yyyy HH:mm',
  },
  'en-GB': {
    Numeric: 'dd/MM/yyyy HH:mm',
    Short: 'd/M/yyyy HH:mm',
    Medium: 'd MMM yyyy HH:mm',
  },
  'ja-JP': {
    Numeric: 'yyyy/MM/dd HH:mm',
    Short: 'yyyy/M/d HH:mm',
    Medium: "yyyy'年'M'月'd'日' HH:mm",
  },
  'fr-FR': {
    Numeric: 'dd/MM/yyyy HH:mm',
    Short: 'd/M/yyyy HH:mm',
    Medium: 'd MMM yyyy HH:mm',
  },
  'zh-CN': {
    Numeric: 'yyyy/MM/dd HH:mm',
    Short: 'yyyy/M/d HH:mm',
    Medium: "yyyy'年'M'月'd'日' HH:mm",
  },
  'zh-TW': {
    Numeric: 'yyyy/MM/dd HH:mm',
    Short: 'yyyy/M/d HH:mm',
    Medium: "yyyy'年'M'月'd'日' HH:mm",
  },
};

export const LOCALE_DATE_FNS_LOCALE: Record<SupportedLocale, Locale> = {
  'vi-VN': vi,
  'en-US': enUS,
  'en-GB': enGB,
  'ja-JP': ja,
  'fr-FR': fr,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};
