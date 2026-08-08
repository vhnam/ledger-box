import { Link } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import { FormattedMessage } from 'react-intl';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@vhnam/ui/components/sidebar';

import { AppSidebarSecondary } from '#/layouts/app-layout/app-sidebar-secondary';
import { AppSidebarUser } from '#/layouts/app-layout/app-sidebar-user';
import { AppSidebarWallets } from '#/layouts/app-layout/app-sidebar-wallets';

function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-(--header-height) shrink-0 justify-center border-b border-sidebar-border">
        <div className="flex items-center gap-1">
          <SidebarMenu className="min-w-0 flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={
                  <Link to="/">
                    <img src="/logo.svg" alt="Ledger Box" className="size-8" />
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                      <span className="font-heading font-medium">Ledger Box</span>
                      <span className="text-xs text-muted-foreground">
                        <FormattedMessage id="brand.tagline" defaultMessage="Wallet Management" />
                      </span>
                    </div>
                  </Link>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden hidden md:block" />
        </div>
      </SidebarHeader>
      <SidebarContent className="scroll-fade overflow-y-auto">
        <AppSidebarWallets />
        <AppSidebarSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <AppSidebarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
