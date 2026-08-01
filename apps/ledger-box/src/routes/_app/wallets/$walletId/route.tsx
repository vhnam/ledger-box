import { createFileRoute } from '@tanstack/react-router';

import { WalletShellLayout } from '#/modules/wallets/wallet-shell-layout';

export const Route = createFileRoute('/_app/wallets/$walletId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletShellLayout walletId={walletId} />;
}
