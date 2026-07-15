import { ScrollArea } from '@vhnam/ui/components/scroll-area';
import { Spinner } from '@vhnam/ui/components/spinner';

import { WalletEmpty } from '#/modules/wallets/wallet-empty';
import { WalletHeader } from '#/modules/wallets/wallet-header';
import { WalletSummary } from '#/modules/wallets/wallet-summary';
import { useTransactions } from '#/queries/transactions/transaction.queries';
import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

import { WalletActions, useWalletActions } from '../wallet-actions';
import { WalletTransactions } from '../wallet-transactions';

interface WalletPageProps {
  walletId: string;
}

function WalletPage({ walletId }: WalletPageProps) {
  const filters = useWalletActions();
  const { data: wallets } = useWallets();
  const { data: wallet, isPending, isError } = useWallet(walletId);
  const { data: transactionsPage, isPending: isTransactionsPending } = useTransactions(walletId, {
    page: 1,
    pageSize: 1,
  });
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);
  const hasTransactions = (transactionsPage?.total ?? 0) > 0;
  const showTransactions = !isTransactionsPending && hasTransactions;

  if (!walletPreview && isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-32 text-default-foreground" />
      </div>
    );
  }

  if (isError || !walletId) {
    return <p className="text-sm text-destructive">Failed to load wallet.</p>;
  }

  if (!walletPreview) {
    return <p className="text-sm text-destructive">Wallet not found.</p>;
  }

  return (
    <>
      <WalletHeader wallet={walletPreview} />
      <div className="h-[calc(100vh-var(--header-height))] w-full">
        <ScrollArea scrollRestorationId="wallet-main" className="h-full w-full">
          <div className="mx-auto max-w-5xl">
            <div className="flex w-full max-w-5xl flex-col gap-4 p-4 lg:p-6">
              <WalletActions hasTransactions={showTransactions} filters={filters} />
              {!isTransactionsPending && !hasTransactions ? (
                <WalletEmpty variant="transactions" />
              ) : (
                <>
                  <WalletSummary walletId={walletId} transactionQuery={filters.transactionQuery} />
                  <WalletTransactions walletId={walletId} transactionQuery={filters.transactionQuery} />
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

export { WalletPage };
