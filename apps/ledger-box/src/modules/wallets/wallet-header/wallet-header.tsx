import { FormattedMessage } from 'react-intl';

import { SidebarTrigger } from '@vhnam/ui/components/sidebar';
import { cn } from '@vhnam/ui/lib/utils';

import { formatCurrency } from '@vhnam/utils/currency';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

interface WalletHeaderProps {
  wallet: WalletDto;
}

function WalletHeader({ wallet }: WalletHeaderProps) {
  const locale = useAppLocale();
  const amount = formatCurrency(wallet.amount, { currency: wallet.currency, locale });

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-sidebar transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="mr-2 md:hidden" />
        <div className="flex flex-col">
          <h1 className="font-heading text-base font-medium">{wallet.name}</h1>
          <p
            className={cn(
              'text-xs text-muted-foreground',
              wallet.amount >= 0 ? 'text-muted-foreground' : 'text-rose-400',
            )}
          >
            <FormattedMessage
              id="wallet.header.newBalance"
              defaultMessage="New balance: {amount}"
              values={{ amount }}
            />
          </p>
        </div>
      </div>
    </header>
  );
}

export { WalletHeader };
