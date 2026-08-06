import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@vhnam/ui/components/empty';
import { Icon } from '@vhnam/ui/components/icon';

import { CreateWalletDialog } from '#/modules/wallets/wallet-create-dialog';

type WalletEmptyVariant = 'wallets' | 'transactions';

type WalletEmptyProps = {
  variant?: WalletEmptyVariant;
};

function WalletEmpty({ variant = 'wallets' }: WalletEmptyProps) {
  const [createWalletOpen, setCreateWalletOpen] = useState(false);

  if (variant === 'transactions') {
    return (
      <Empty className="flex-none py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name="ArrowsLeftRightIcon" />
          </EmptyMedia>
          <EmptyTitle className="font-heading text-lg">
            <FormattedMessage id="wallet.empty.transactions.title" defaultMessage="No transactions yet" />
          </EmptyTitle>
          <EmptyDescription>
            <FormattedMessage
              id="wallet.empty.transactions.description"
              defaultMessage="Add your first income or expense to start tracking activity in this wallet."
            />
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name="WalletIcon" />
          </EmptyMedia>
          <EmptyTitle className="font-heading text-lg">
            <FormattedMessage id="wallet.empty.wallets.title" defaultMessage="No wallets yet" />
          </EmptyTitle>
          <EmptyDescription>
            <FormattedMessage
              id="wallet.empty.wallets.description"
              defaultMessage="Create your first wallet to start tracking balances and transactions."
            />
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => setCreateWalletOpen(true)}>
            <Icon name="PlusIcon" />
            <span>
              <FormattedMessage id="wallet.empty.wallets.cta" defaultMessage="New wallet" />
            </span>
          </Button>
        </EmptyContent>
      </Empty>
      <CreateWalletDialog open={createWalletOpen} onOpenChange={setCreateWalletOpen} />
    </>
  );
}

export { WalletEmpty };
