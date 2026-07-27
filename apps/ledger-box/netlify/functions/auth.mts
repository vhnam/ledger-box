import type { Config } from '@netlify/functions';

import { auth } from '#/lib/auth.ts';

export default async (request: Request) => auth.handler(request);

export const config: Config = {
  path: '/api/auth/*',
};
