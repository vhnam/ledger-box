import { Link } from '@tanstack/react-router';

import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { ScrollArea } from '@vhnam/ui/components/scroll-area';
import { Spinner } from '@vhnam/ui/components/spinner';

import { WalletHeader } from '#/modules/wallets/wallet-header';
import { WalletSettingsDangerZone } from '#/modules/wallets/wallet-settings-danger-zone';
import { WalletSettingsGeneral } from '#/modules/wallets/wallet-settings-general';
import { WalletSettingsMembers } from '#/modules/wallets/wallet-settings-members';
import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

type WalletSettingsPageProps = {
  walletId: string;
};

function WalletSettingsPage({ walletId }: WalletSettingsPageProps) {
  const { data: wallets } = useWallets();
  const { data: wallet, isPending, isError } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);

  if (!walletPreview && isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-32 text-default-foreground" />
      </div>
    );
  }

  if (isError || !walletId) {
    return <p className="text-sm text-destructive">Failed to load wallet.</p>;
  }

  if (!walletPreview) {
    return <p className="text-sm text-destructive">Wallet not found.</p>;
  }

  return (
    <>
      <WalletHeader wallet={walletPreview} />
      <div className="h-[calc(100vh-var(--header-height))]">
        <ScrollArea scrollRestorationId="wallet-settings" className="h-full w-full">
          <div className="mx-auto max-w-5xl">
            <div className="flex w-full max-w-5xl flex-col gap-6 p-4 lg:p-6">
              <Button
                variant="ghost"
                className="w-fit"
                nativeButton={false}
                render={
                  <Link to="/wallets/$walletId" params={{ walletId }}>
                    <Icon name="ArrowLeftIcon" />
                    Back to wallet
                  </Link>
                }
              />

              <div className="max-w-2xl mx-auto w-full space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="font-heading text-lg font-medium">Wallet settings</h2>
                  <p className="text-sm text-muted-foreground">Manage your wallet name, members, and preferences.</p>
                </div>

                <WalletSettingsGeneral wallet={walletPreview} />
                <WalletSettingsMembers wallet={walletPreview} />
                <WalletSettingsDangerZone wallet={walletPreview} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

export { WalletSettingsPage };
