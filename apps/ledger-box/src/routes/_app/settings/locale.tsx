import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings/locale')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/appearance' });
  },
});
