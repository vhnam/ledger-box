import { WalletSettingsStatementShares } from '#/modules/wallet-settings/wallet-settings-statement-shares/wallet-settings-statement-shares';
import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

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
