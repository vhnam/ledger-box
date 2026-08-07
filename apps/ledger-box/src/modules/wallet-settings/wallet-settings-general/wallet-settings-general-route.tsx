import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

import { WalletSettingsGeneral } from '#/modules/wallet-settings/wallet-settings-general/wallet-settings-general';

type WalletSettingsGeneralRouteProps = {
  walletId: string;
};

function WalletSettingsGeneralRoute({ walletId }: WalletSettingsGeneralRouteProps) {
  const { data: wallets } = useWallets();
  const { data: wallet } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);

  if (!walletPreview) {
    return null;
  }

  return <WalletSettingsGeneral wallet={walletPreview} />;
}

export { WalletSettingsGeneralRoute };
