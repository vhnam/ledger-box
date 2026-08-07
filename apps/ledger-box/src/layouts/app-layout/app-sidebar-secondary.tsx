import type { ComponentProps } from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Icon } from '@vhnam/ui/components/icon';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@vhnam/ui/components/sidebar';

import { CreateWalletDialog } from '#/modules/wallets/wallet-create-dialog';

function AppSidebarSecondary({ className, ...props }: ComponentProps<typeof SidebarGroup>) {
  const intl = useIntl();
  const [createWalletOpen, setCreateWalletOpen] = useState(false);
  const newWalletLabel = intl.formatMessage({ id: 'nav.newWallet', defaultMessage: 'New wallet' });

  return (
    <SidebarGroup className={className} {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={newWalletLabel}
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
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon name="PlusIcon" aria-hidden />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  <FormattedMessage id="nav.newWallet" defaultMessage="New wallet" />
                </span>
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
