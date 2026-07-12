import { Separator } from '@vhnam/ui/components/separator';
import { SidebarTrigger } from '@vhnam/ui/components/sidebar';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

interface WalletHeaderProps {
  wallet: WalletDto;
}
function WalletHeader({ wallet }: WalletHeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-sidebar">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-7" />
        <h1 className="text-base font-medium">{wallet.name}</h1>
      </div>
    </header>
  );
}

export { WalletHeader };
