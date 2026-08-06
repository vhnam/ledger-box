import { createFileRoute } from '@tanstack/react-router';

import { SettingsAppearance } from '#/modules/settings/settings-appearance';

export const Route = createFileRoute('/_app/settings/appearance')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsAppearance />;
}
