import { createFileRoute } from '@tanstack/react-router';

import { SettingsAccount } from '#/modules/settings/settings-account';

export const Route = createFileRoute('/_app/settings/account')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsAccount />;
}
