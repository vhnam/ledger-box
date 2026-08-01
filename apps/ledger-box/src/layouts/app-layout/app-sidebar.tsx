import { Link } from '@tanstack/react-router';
import type { ComponentProps } from 'react';

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

import { AppSidebarSecondary } from '#/layouts/app-layout/app-sidebar-secondary';
import { AppSidebarUser } from '#/layouts/app-layout/app-sidebar-user';
import { AppSidebarWallets } from '#/layouts/app-layout/app-sidebar-wallets';

function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-(--header-height) shrink-0 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link to="/">
                  <img src="/logo.svg" alt="Ledger Box" className="size-8" />
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-heading font-medium">Ledger Box</span>
                    <span className="text-xs text-muted-foreground">Wallet Management</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="scroll-fade overflow-y-auto">
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
