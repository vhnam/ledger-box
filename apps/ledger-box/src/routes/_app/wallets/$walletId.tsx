import { createFileRoute } from '@tanstack/react-router';

import { WalletPage } from '#/modules/wallets/wallet-page';

export const Route = createFileRoute('/_app/wallets/$walletId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletPage walletId={walletId} />;
}
