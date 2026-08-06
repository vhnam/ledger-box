import { createFileRoute } from '@tanstack/react-router';

import { SettingsLocale } from '#/modules/settings/settings-locale';

export const Route = createFileRoute('/_app/settings/locale')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsLocale />;
}
