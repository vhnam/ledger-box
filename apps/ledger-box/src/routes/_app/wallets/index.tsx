import { createFileRoute, Navigate } from '@tanstack/react-router';

import { Spinner } from '@vhnam/ui/components/spinner';

import { WalletEmpty } from '#/modules/wallets/wallet-empty';
import { useWallets } from '#/queries/wallets/wallet.queries';

export const Route = createFileRoute('/_app/wallets/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: wallets, isPending, isError } = useWallets();

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-32 text-accent" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load wallets.</p>;
  }

  if (wallets?.length === 0) {
    return <WalletEmpty />;
  }

  if (wallets?.length > 0) {
    return <Navigate to="/wallets/$walletId" params={{ walletId: wallets[0].id }} replace />;
  }

  return null;
}
