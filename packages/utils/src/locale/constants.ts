export const SUPPORTED_LOCALES = ['vi-VN', 'en-US', 'en-GB', 'ja-JP', 'fr-FR'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Fallback used when the browser's `Accept-Language` doesn't match a supported locale. */
export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
