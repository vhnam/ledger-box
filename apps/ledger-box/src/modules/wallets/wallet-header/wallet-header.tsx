import { Separator } from '@vhnam/ui/components/separator';
import { SidebarTrigger } from '@vhnam/ui/components/sidebar';

import { formatCurrency } from '@vhnam/utils/currency';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

interface WalletHeaderProps {
  wallet: WalletDto;
}
function WalletHeader({ wallet }: WalletHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-sidebar transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-12" />
        <div className="flex flex-col">
          <h1 className="font-heading text-base font-medium">{wallet.name}</h1>
          <p className="text-xs text-muted-foreground">New balance: {formatCurrency(wallet.amount)}</p>
        </div>
      </div>
    </header>
  );
}

export { WalletHeader };
