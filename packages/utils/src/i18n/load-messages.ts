import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '../locale/constants.ts';
import enUS from './messages/en-US.json';

/** Catalog id — one JSON file per supported locale (English and Chinese are region-split). */
export type MessageLanguage = SupportedLocale;

export type MessageCatalog = Record<string, string>;

/** Sync default catalog — always available for first paint and English fallbacks. */
export const DEFAULT_MESSAGES: MessageCatalog = enUS;

const catalogLoaders: Record<MessageLanguage, () => Promise<MessageCatalog>> = {
  'en-US': () => Promise.resolve(enUS),
  'en-GB': () => import('./messages/en-GB.json').then((mod) => mod.default),
  'vi-VN': () => import('./messages/vi-VN.json').then((mod) => mod.default),
  'ja-JP': () => import('./messages/ja-JP.json').then((mod) => mod.default),
  'fr-FR': () => import('./messages/fr-FR.json').then((mod) => mod.default),
  'zh-CN': () => import('./messages/zh-CN.json').then((mod) => mod.default),
  'zh-TW': () => import('./messages/zh-TW.json').then((mod) => mod.default),
};

const catalogCache = new Map<MessageLanguage, MessageCatalog>([[DEFAULT_LOCALE, enUS]]);

/** Resolves a BCP-47 locale tag to a message catalog. Unknown tags fall back to `en-US`. */
export function toMessageLanguage(locale: string): MessageLanguage {
  if (isSupportedLocale(locale)) {
    return locale;
  }

  return DEFAULT_LOCALE;
}

export function getCachedMessages(locale: string): MessageCatalog | undefined {
  return catalogCache.get(toMessageLanguage(locale));
}

/** Loads (and caches) the message catalog for a locale. Safe to call repeatedly. */
export async function loadMessages(locale: string): Promise<MessageCatalog> {
  const language = toMessageLanguage(locale);
  const cached = catalogCache.get(language);

  if (cached) {
    return cached;
  }

  const catalog = await catalogLoaders[language]();
  catalogCache.set(language, catalog);
  return catalog;
}
