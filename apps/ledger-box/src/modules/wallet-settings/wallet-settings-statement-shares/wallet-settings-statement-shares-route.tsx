import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

import { WalletSettingsStatementShares } from './wallet-settings-statement-shares';

type WalletSettingsStatementSharesRouteProps = {
  walletId: string;
};

function WalletSettingsStatementSharesRoute({ walletId }: WalletSettingsStatementSharesRouteProps) {
  const { data: wallets } = useWallets();
  const { data: wallet } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);

  if (!walletPreview) {
    return null;
  }

  return <WalletSettingsStatementShares wallet={walletPreview} />;
}

export { WalletSettingsStatementSharesRoute };
