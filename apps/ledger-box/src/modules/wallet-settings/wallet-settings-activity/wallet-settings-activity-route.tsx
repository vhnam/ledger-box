import { Navigate } from '@tanstack/react-router';

import { WalletSettingsActivity } from '#/modules/wallet-settings/wallet-settings-activity/wallet-settings-activity';
import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

type WalletSettingsActivityRouteProps = {
  walletId: string;
};

function WalletSettingsActivityRoute({ walletId }: WalletSettingsActivityRouteProps) {
  const { data: wallets } = useWallets();
  const { data: wallet } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);

  if (!walletPreview) {
    return null;
  }

  if (walletPreview.role !== 'owner') {
    return <Navigate to="/wallets/$walletId/settings/general" params={{ walletId }} replace />;
  }

  return <WalletSettingsActivity walletId={walletPreview.id} />;
}

export { WalletSettingsActivityRoute };
