import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '@vhnam/utils/locale';

import { db } from '#/lib/db/index.ts';

/**
 * Resolves the stored locale for a tenant (v1: better-auth user id).
 * Falls back to `DEFAULT_LOCALE` when settings are missing or unsupported.
 */
async function getUserLocale(tenantId: string): Promise<SupportedLocale> {
  const settings = await db
    .selectFrom('userSettings')
    .select(['locale'])
    .where('tenantId', '=', tenantId)
    .executeTakeFirst();

  if (settings?.locale && isSupportedLocale(settings.locale)) {
    return settings.locale;
  }

  return DEFAULT_LOCALE;
}

export { getUserLocale };
