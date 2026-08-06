import { FormattedMessage } from 'react-intl';

import { Spinner } from '@vhnam/ui/components/spinner';

import { WalletActions, useWalletActions } from '#/modules/wallets/wallet-actions';
import { WalletEmpty } from '#/modules/wallets/wallet-empty';
import { WalletSummary } from '#/modules/wallets/wallet-summary';
import { WalletTransactions } from '#/modules/wallets/wallet-transactions';
import { useTransactions } from '#/queries/transactions/transaction.queries';
import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

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
    return (
      <p className="text-sm text-destructive">
        <FormattedMessage id="wallet.error.loadFailed" defaultMessage="Failed to load wallet." />
      </p>
    );
  }

  if (!walletPreview) {
    return (
      <p className="text-sm text-destructive">
        <FormattedMessage id="wallet.error.notFound" defaultMessage="Wallet not found." />
      </p>
    );
  }

  return (
    <div className="mx-auto lg:max-w-5xl">
      <div className="flex w-full max-w-5xl flex-col gap-4">
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
  );
}

export { WalletPage };
