import { Navigate } from '@tanstack/react-router';

import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

import { WalletSettingsActivities } from './wallet-settings-activities';

type WalletSettingsActivitiesRouteProps = {
  walletId: string;
};

function WalletSettingsActivitiesRoute({ walletId }: WalletSettingsActivitiesRouteProps) {
  const { data: wallets } = useWallets();
  const { data: wallet } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);

  if (!walletPreview) {
    return null;
  }

  if (walletPreview.role !== 'owner') {
    return <Navigate to="/wallets/$walletId/settings/general" params={{ walletId }} replace />;
  }

  return <WalletSettingsActivities walletId={walletPreview.id} currency={walletPreview.currency} />;
}

export { WalletSettingsActivitiesRoute };
