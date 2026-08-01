import { createFileRoute } from '@tanstack/react-router';

import { WalletSettingsStatementSharesRoute } from '#/modules/wallet-settings/wallet-settings-statement-shares';

export const Route = createFileRoute('/_app/wallets/$walletId/settings/statement-shares')({
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletSettingsStatementSharesRoute walletId={walletId} />;
}
