import type { ComponentProps } from 'react';
import { useState } from 'react';

import { Icon } from '@vhnam/ui/components/icon';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@vhnam/ui/components/sidebar';
import { cn } from '@vhnam/ui/lib/utils';

import { CreateWalletDialog } from '#/modules/wallets/create-wallet-dialog';

function AppSidebarSecondary({ className, ...props }: ComponentProps<typeof SidebarGroup>) {
  const [createWalletOpen, setCreateWalletOpen] = useState(false);

  return (
    <SidebarGroup className={cn('p-0', className)} {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="New wallet"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              render={
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={createWalletOpen}
                  onClick={() => setCreateWalletOpen(true)}
                />
              }
            >
              <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-accent text-accent-foreground">
                <Icon name="PlusIcon" aria-hidden />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">New wallet</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
      <CreateWalletDialog open={createWalletOpen} onOpenChange={setCreateWalletOpen} />
    </SidebarGroup>
  );
}

export { AppSidebarSecondary };
