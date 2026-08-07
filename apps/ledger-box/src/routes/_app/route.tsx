import { createFileRoute, redirect } from '@tanstack/react-router';

import { authClient } from '#/lib/auth/auth-client';

import { AppLayout } from '#/layouts/app-layout';

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    if (!session) {
      throw redirect({ to: '/auth/login' });
    }

    return { session };
  },
  component: AppLayout,
});
