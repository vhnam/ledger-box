import type { Config } from '@netlify/functions';
import * as v from 'valibot';

import { auth } from '#/lib/auth/auth.ts';
import { db } from '#/lib/db/index.ts';
import { updateUserLocaleSchema } from '#/schemas/user-locale.schema.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';
import { getTenantId } from './lib/tenant-access.ts';

/**
 * Matches the migration's `user_settings.locale` backfill default (`0010_create_user_settings.ts`)
 * — a missing row (pre-hook user, or a failed signup-time write) behaves identically to an
 * already-backfilled existing user, never the Accept-Language detection fallback (`en-US`).
 */
const MISSING_SETTINGS_LOCALE_FALLBACK = 'vi-VN';

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  const tenantId = getTenantId(session);

  if (request.method === 'GET') {
    const settings = await db
      .selectFrom('userSettings')
      .select(['locale'])
      .where('tenantId', '=', tenantId)
      .executeTakeFirst();

    return Response.json({ locale: settings?.locale ?? MISSING_SETTINGS_LOCALE_FALLBACK });
  }

  if (request.method === 'PATCH') {
    const body = (await request.json().catch(() => null)) as unknown;
    const result = v.safeParse(updateUserLocaleSchema, body);

    if (!result.success) {
      const issue = result.issues[0]?.message;
      if (issue === 'validation.locale.unsupported' || issue === 'Unsupported locale') {
        return apiError('UNSUPPORTED_LOCALE', 400);
      }
      return apiError('INVALID_REQUEST_BODY', 400);
    }

    const { locale } = result.output;

    await db
      .insertInto('userSettings')
      .values({ tenantId, locale, createdAt: new Date(), updatedAt: new Date() })
      .onConflict((oc) => oc.column('tenantId').doUpdateSet({ locale, updatedAt: new Date() }))
      .execute();

    return Response.json({ locale });
  }

  return ApiErrors.methodNotAllowed();
};

export const config: Config = {
  path: '/api/users/locale',
};
