import { ScrollArea } from '@vhnam/ui/components/scroll-area';
import { Spinner } from '@vhnam/ui/components/spinner';

import { WalletEmpty } from '#/modules/wallets/wallet-empty';
import { WalletHeader } from '#/modules/wallets/wallet-header';
import { WalletSummary } from '#/modules/wallets/wallet-summary';
import { useTransactions } from '#/queries/transactions/transaction.queries';
import { useWallet } from '#/queries/wallets/wallet.queries';

import { WalletActions, useWalletActions } from '../wallet-actions';
import { WalletTransactions } from '../wallet-transactions';

interface WalletPageProps {
  walletId: string;
}

function WalletPage({ walletId }: WalletPageProps) {
  const filters = useWalletActions();
  const { data: wallet, isPending, isError } = useWallet(walletId);
  const { data: transactionsPage, isPending: isTransactionsPending } = useTransactions(walletId, {
    page: 1,
    pageSize: 1,
  });
  const hasTransactions = (transactionsPage?.total ?? 0) > 0;

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
      <ScrollArea className="h-[calc(100vh-var(--header-height))] w-full">
        <div className="mx-auto max-w-5xl">
          <div className="flex w-full max-w-5xl flex-col gap-4 p-4 lg:p-6">
            <WalletActions hasTransactions={!isTransactionsPending && hasTransactions} filters={filters} />
            {isTransactionsPending ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-8 text-muted-foreground" />
              </div>
            ) : hasTransactions ? (
              <>
                <WalletSummary walletId={walletId} transactionQuery={filters.transactionQuery} />
                <WalletTransactions walletId={walletId} transactionQuery={filters.transactionQuery} />
              </>
            ) : (
              <WalletEmpty variant="transactions" />
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}

export { WalletPage };
