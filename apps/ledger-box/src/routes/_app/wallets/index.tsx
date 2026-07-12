import { RiWalletLine } from '@remixicon/react';
import { createFileRoute } from '@tanstack/react-router';

import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';

import { CreateWalletDialog } from '#/modules/wallets/create-wallet-dialog';
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
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon icon={RiWalletLine} className="size-6" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-lg font-medium">No wallets yet</h1>
            <p className="text-sm text-muted-foreground">
              Create your first wallet to start tracking balances and transactions.
            </p>
          </div>
          <div className="w-full">
            <CreateWalletDialog />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
