import { createFileRoute } from '@tanstack/react-router';

import { WalletSettingsMembersRoute } from '#/modules/wallet-settings/wallet-settings-members';

export const Route = createFileRoute('/_app/wallets/$walletId/settings/members')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletSettingsMembersRoute walletId={walletId} />;
}
