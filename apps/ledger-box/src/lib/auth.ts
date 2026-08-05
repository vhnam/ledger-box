import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

import { parseAcceptLanguage } from '@vhnam/utils/locale';

import { db } from '#/lib/db/index.ts';

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          try {
            const headerValue =
              context?.headers?.get('accept-language') ?? context?.request?.headers.get('accept-language') ?? null;
            const locale = parseAcceptLanguage(headerValue);

            await db
              .insertInto('userSettings')
              .values({ tenantId: user.id, locale, createdAt: new Date(), updatedAt: new Date() })
              .execute();
          } catch (error) {
            // A failed settings write must never block account creation — the user can
            // still be backfilled or set their locale manually via User Settings.
            console.error('Failed to record user_settings for new user', user.id, error);
          }
        },
      },
    },
  },
});
