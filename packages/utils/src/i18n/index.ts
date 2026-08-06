import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '../locale/constants.ts';
import enGB from './messages/en-GB.json';
import enUS from './messages/en-US.json';
import frFR from './messages/fr-FR.json';
import jaJP from './messages/ja-JP.json';
import viVN from './messages/vi-VN.json';
import zhCN from './messages/zh-CN.json';
import zhTW from './messages/zh-TW.json';

/** Catalog id — one JSON file per supported locale (English and Chinese are region-split). */
export type MessageLanguage = SupportedLocale;

export const MESSAGES: Record<MessageLanguage, Record<string, string>> = {
  'en-US': enUS,
  'en-GB': enGB,
  'vi-VN': viVN,
  'ja-JP': jaJP,
  'fr-FR': frFR,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

/** Resolves a BCP-47 locale tag to a message catalog. Unknown tags fall back to `en-US`. */
export function toMessageLanguage(locale: string): MessageLanguage {
  if (isSupportedLocale(locale)) {
    return locale;
  }

  return DEFAULT_LOCALE;
}
