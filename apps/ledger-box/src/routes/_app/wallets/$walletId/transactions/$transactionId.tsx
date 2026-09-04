import { createFileRoute } from '@tanstack/react-router';

import { WalletTransactionDetailRoute } from '#/modules/wallet-transaction-detail';

export const Route = createFileRoute('/_app/wallets/$walletId/transactions/$transactionId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId, transactionId } = Route.useParams();

  return <WalletTransactionDetailRoute walletId={walletId} transactionId={transactionId} />;
}
