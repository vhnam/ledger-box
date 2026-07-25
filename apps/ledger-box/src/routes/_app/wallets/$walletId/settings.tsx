import { createFileRoute } from '@tanstack/react-router';

import { WalletSettingsPage } from '#/modules/wallets/wallet-settings-page';

export const Route = createFileRoute('/_app/wallets/$walletId/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletSettingsPage walletId={walletId} />;
}
