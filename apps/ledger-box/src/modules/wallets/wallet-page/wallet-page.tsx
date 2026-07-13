import { Spinner } from '@vhnam/ui/components/spinner';

import { WalletHeader } from '#/modules/wallets/wallet-header';
import { WalletSummary } from '#/modules/wallets/wallet-summary';
import { useWallet } from '#/queries/wallets/wallet.queries';

import { WalletActions } from '../wallet-actions';
import { WalletTransactions } from '../wallet-transactions';

interface WalletPageProps {
  walletId: string;
}

function WalletPage({ walletId }: WalletPageProps) {
  const { data: wallet, isPending, isError } = useWallet(walletId);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-32 text-accent" />
      </div>
    );
  }

  if (isError || !walletId) {
    return <p className="text-sm text-destructive">Failed to load wallet.</p>;
  }

  if (!wallet) {
    return <p className="text-sm text-destructive">Wallet not found.</p>;
  }

  return (
    <>
      <WalletHeader wallet={wallet} />

      <div className="mx-auto mt-[calc(var(--header-height)+1rem)] w-full max-w-5xl p-4 lg:p-6 flex flex-col gap-4">
        <WalletActions />
        <WalletSummary />
        <WalletTransactions walletId={walletId} />
      </div>
    </>
  );
}

export { WalletPage };
