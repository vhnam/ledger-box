import type { Config } from '@netlify/functions';
import { sql } from 'kysely';

import { auth } from '#/lib/auth/auth.ts';
import { db } from '#/lib/db/index.ts';

import { ApiErrors, apiError } from './lib/api-error-response.ts';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export default async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return ApiErrors.unauthorized();
  }

  if (request.method !== 'GET') {
    return ApiErrors.methodNotAllowed();
  }

  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() ?? '';

  if (!email) {
    return apiError('EMAIL_REQUIRED', 400);
  }

  const result = await sql<UserRow>`
    select id, name, email, image
    from "user"
    where lower(email) = ${email}
    limit 1
  `.execute(db);

  const user = result.rows[0];

  if (!user) {
    return Response.json(null);
  }

  return Response.json({
    id: user.id,
    name: user.name?.trim() || null,
    email: user.email,
    image: user.image ?? null,
  });
};

export const config: Config = {
  path: '/api/users/by-email',
};
