import en from './messages/en.json';
import fr from './messages/fr.json';
import ja from './messages/ja.json';
import vi from './messages/vi.json';

export type MessageLanguage = 'en' | 'vi' | 'ja' | 'fr';

export const MESSAGES: Record<MessageLanguage, Record<string, string>> = { en, vi, ja, fr };
