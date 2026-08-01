import { createFileRoute } from '@tanstack/react-router';

import { WalletSettingsGeneralRoute } from '#/modules/wallet-settings/wallet-settings-general';

export const Route = createFileRoute('/_app/wallets/$walletId/settings/general')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletSettingsGeneralRoute walletId={walletId} />;
}
