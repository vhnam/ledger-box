import { FormattedMessage } from 'react-intl';

import { Spinner } from '@vhnam/ui/components/ui/spinner';

import { useTransaction } from '#/queries/transactions/transaction.queries';

import { WalletTransactionDetail } from '#/modules/wallet-transaction-detail/wallet-transaction-detail';

type WalletTransactionDetailRouteProps = {
  walletId: string;
  transactionId: string;
};

function WalletTransactionDetailRoute({ walletId, transactionId }: WalletTransactionDetailRouteProps) {
  const { data: transaction, isPending, isError } = useTransaction(walletId, transactionId);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-dvh">
        <Spinner className="size-32 text-default-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        <FormattedMessage id="transaction.detail.error.loadFailed" defaultMessage="Failed to load transaction." />
      </p>
    );
  }

  if (!transaction) {
    return (
      <p className="text-sm text-destructive">
        <FormattedMessage id="transaction.detail.error.notFound" defaultMessage="Transaction not found." />
      </p>
    );
  }

  return <WalletTransactionDetail transaction={transaction} />;
}

export { WalletTransactionDetailRoute };
