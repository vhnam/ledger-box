import type { ComponentProps } from 'react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@vhnam/ui/components/sidebar';

import { CreateWalletDialog } from '#/modules/wallets/create-wallet-dialog';

function AppSidebarSecondary(props: ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" variant="outline" render={<CreateWalletDialog />} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export { AppSidebarSecondary };
