import { RiAddLine } from '@remixicon/react';
import type { ComponentProps } from 'react';

import { Icon } from '@vhnam/ui/components/icon';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@vhnam/ui/components/sidebar';

function AppSidebarSecondary(props: ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" variant="outline">
              <Icon icon={RiAddLine} />
              <span>Add new wallet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export { AppSidebarSecondary };
