import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

import { WalletSettingsMembers } from '#/modules/wallet-settings/wallet-settings-members/wallet-settings-members';

type WalletSettingsMembersRouteProps = {
  walletId: string;
};

function WalletSettingsMembersRoute({ walletId }: WalletSettingsMembersRouteProps) {
  const { data: wallets } = useWallets();
  const { data: wallet } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);

  if (!walletPreview) {
    return null;
  }

  return <WalletSettingsMembers wallet={walletPreview} />;
}

export { WalletSettingsMembersRoute };
