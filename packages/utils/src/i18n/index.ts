export type { MessageCatalog, MessageLanguage } from './load-messages.ts';
export { DEFAULT_MESSAGES, getCachedMessages, loadMessages, toMessageLanguage } from './load-messages.ts';

/**
 * Sync `MESSAGES` for Netlify / server only — import from
 * `@vhnam/utils/i18n/all-messages`, not from this barrel, so the client does not
 * pull every locale JSON into the main intl chunk.
 */
