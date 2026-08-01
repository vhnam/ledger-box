import { createFileRoute } from '@tanstack/react-router';

import { WalletSettingsDangerZoneRoute } from '#/modules/wallet-settings/wallet-settings-danger-zone';

export const Route = createFileRoute('/_app/wallets/$walletId/settings/danger-zone')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletSettingsDangerZoneRoute walletId={walletId} />;
}
