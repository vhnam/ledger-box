import en from './messages/en.json';
import fr from './messages/fr.json';
import ja from './messages/ja.json';
import vi from './messages/vi.json';

export type MessageLanguage = 'en' | 'vi' | 'ja' | 'fr';

export const MESSAGES: Record<MessageLanguage, Record<string, string>> = { en, vi, ja, fr };

/** `en-US`/`en-GB` share the `en` catalog — language vs. locale split. */
export function toMessageLanguage(locale: string): MessageLanguage {
  const language = locale.split('-')[0] ?? 'en';

  if (language === 'vi' || language === 'ja' || language === 'fr' || language === 'en') {
    return language;
  }

  return 'en';
}
