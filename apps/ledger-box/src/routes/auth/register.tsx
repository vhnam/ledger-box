import { createFileRoute } from '@tanstack/react-router';

import { RegisterPage } from '#/modules/auth/register';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});
