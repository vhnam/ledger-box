import { createFileRoute } from '@tanstack/react-router';

import { SettingsShellLayout } from '#/layouts/settings-shell-layout';

export const Route = createFileRoute('/_app/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsShellLayout />;
}
