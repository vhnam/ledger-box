import { Link, useParams } from '@tanstack/react-router';
import type { ComponentProps } from 'react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@vhnam/ui/components/sidebar';
import { Skeleton } from '@vhnam/ui/components/skeleton';
import { cn } from '@vhnam/ui/lib/utils';

import { formatCurrency } from '@vhnam/utils/currency';

import { useWallets } from '#/queries/wallets/wallet.queries';

function AppSidebarWallets(props: ComponentProps<typeof SidebarGroup>) {
  const { data: wallets, isPending } = useWallets();
  const { walletId } = useParams({ strict: false });

  if (isPending) {
    return (
      <SidebarGroup {...props}>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <Skeleton className="h-6 w-full bg-accent" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu className="group-data-[state=expanded]:space-y-0 group-data-[state=collapsed]:space-y-3">
          {wallets?.map((wallet) => (
            <SidebarMenuItem key={wallet.id}>
              <SidebarMenuButton
                size="lg"
                isActive={walletId === wallet.id}
                tooltip={wallet.name}
                render={
                  <Link to="/wallets/$walletId" params={{ walletId: wallet.id }}>
                    <div
                      className={cn(
                        'size-8 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground',
                        {
                          'bg-white text-primary': walletId === wallet.id,
                        },
                      )}
                    >
                      <span className="text-xs uppercase">{wallet.name.charAt(0)}</span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{wallet.name}</span>
                      <span
                        className={cn(
                          'truncate font-medium text-xs',
                          wallet.amount >= 0 ? 'text-emerald-400' : 'text-rose-400',
                        )}
                      >
                        {formatCurrency(wallet.amount)}
                      </span>
                    </div>
                  </Link>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export { AppSidebarWallets };
