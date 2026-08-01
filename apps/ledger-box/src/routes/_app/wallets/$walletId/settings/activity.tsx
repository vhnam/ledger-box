import { createFileRoute } from '@tanstack/react-router';

import { WalletSettingsActivityRoute } from '#/modules/wallet-settings/wallet-settings-activity';

export const Route = createFileRoute('/_app/wallets/$walletId/settings/activity')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletSettingsActivityRoute walletId={walletId} />;
}
