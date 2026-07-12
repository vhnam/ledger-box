import { RiWalletLine } from '@remixicon/react';
import type { ComponentProps } from 'react';

import { Icon } from '@vhnam/ui/components/icon';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@vhnam/ui/components/sidebar';

const wallets = [
  {
    id: '1',
    name: 'Wallet 1',
    amount: 1000,
  },
  {
    id: '2',
    name: 'Wallet 2',
    amount: 2000,
  },
  {
    id: '3',
    name: 'Wallet 3',
    amount: 3000,
  },
  {
    id: '4',
    name: 'Wallet 4',
    amount: 4000,
  },
  {
    id: '5',
    name: 'Wallet 5',
    amount: 5000,
  },
  {
    id: '6',
    name: 'Wallet 6',
    amount: 6000,
  },
  {
    id: '7',
    name: 'Wallet 7',
    amount: 7000,
  },
  {
    id: '8',
    name: 'Wallet 8',
    amount: 8000,
  },
  {
    id: '9',
    name: 'Wallet 9',
    amount: 9000,
  },
  {
    id: '10',
    name: 'Wallet 10',
    amount: 10000,
  },
  {
    id: '11',
    name: 'Wallet 11',
    amount: 11000,
  },
  {
    id: '12',
    name: 'Wallet 12',
    amount: 12000,
  },
  {
    id: '13',
    name: 'Wallet 13',
    amount: 13000,
  },
  {
    id: '14',
    name: 'Wallet 14',
    amount: 14000,
  },
  {
    id: '15',
    name: 'Wallet 15',
    amount: 15000,
  },
  {
    id: '16',
    name: 'Wallet 16',
    amount: 16000,
  },
  {
    id: '17',
    name: 'Wallet 17',
    amount: 17000,
  },
  {
    id: '18',
    name: 'Wallet 18',
    amount: 18000,
  },
  {
    id: '19',
    name: 'Wallet 19',
    amount: 19000,
  },
  {
    id: '20',
    name: 'Wallet 20',
    amount: 20000,
  },
];

function AppSidebarWallets(props: ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {wallets.map((wallet) => (
            <SidebarMenuItem key={wallet.id}>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-accent text-accent-foreground">
                  <Icon icon={RiWalletLine} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{wallet.name}</span>
                  <span className="truncate text-xs">{wallet.amount}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export { AppSidebarWallets };
