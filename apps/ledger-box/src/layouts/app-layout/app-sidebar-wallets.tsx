import { Link, useParams } from '@tanstack/react-router';
import type { ComponentProps } from 'react';

import { Icon } from '@vhnam/ui/components/icon';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@vhnam/ui/components/sidebar';
import { Skeleton } from '@vhnam/ui/components/skeleton';
import { cn } from '@vhnam/ui/lib/utils';

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
        <SidebarMenu>
          {wallets?.map((wallet) => (
            <SidebarMenuItem key={wallet.id}>
              <SidebarMenuButton
                size="lg"
                isActive={walletId === wallet.id}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                render={
                  <Link to="/wallets/$walletId" params={{ walletId: wallet.id }}>
                    <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-accent text-accent-foreground">
                      <Icon name="WalletIcon" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{wallet.name}</span>
                      <span
                        className={cn(
                          'truncate font-medium text-xs',
                          wallet.amount >= 0 ? 'text-emerald-400' : 'text-rose-400',
                        )}
                      >
                        {wallet.amount}
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
