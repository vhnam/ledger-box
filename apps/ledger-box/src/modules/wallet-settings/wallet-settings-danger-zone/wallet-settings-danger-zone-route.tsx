import { WalletSettingsDangerZone } from '#/modules/wallet-settings/wallet-settings-danger-zone/wallet-settings-danger-zone';
import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

type WalletSettingsDangerZoneRouteProps = {
  walletId: string;
};

function WalletSettingsDangerZoneRoute({ walletId }: WalletSettingsDangerZoneRouteProps) {
  const { data: wallets } = useWallets();
  const { data: wallet } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);

  if (!walletPreview) {
    return null;
  }

  return <WalletSettingsDangerZone wallet={walletPreview} />;
}

export { WalletSettingsDangerZoneRoute };
