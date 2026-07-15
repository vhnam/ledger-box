import { Link } from '@tanstack/react-router';
import type { ComponentProps } from 'react';

import { Icon } from '@vhnam/ui/components/icon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@vhnam/ui/components/sidebar';

import { AppSidebarSecondary } from './app-sidebar-secondary';
import { AppSidebarUser } from './app-sidebar-user';
import { AppSidebarWallets } from './app-sidebar-wallets';

function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Icon name="WalletIcon" className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">Ledger Box</span>
                    <span className="text-xs text-muted-foreground">Wallet Management</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="scroll-fade scrollbar-none">
        <AppSidebarWallets />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarSecondary className="mt-auto" />
        <AppSidebarUser />
        <SidebarRail />
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppSidebar };
