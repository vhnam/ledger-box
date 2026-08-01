import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Icon, type IconName } from '@vhnam/ui/components/icon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@vhnam/ui/components/sidebar';

const items: { title: string; icon: IconName }[] = [
  { title: 'Home', icon: 'HouseIcon' },
  { title: 'Profile', icon: 'UserIcon' },
  { title: 'Settings', icon: 'GearIcon' },
];

const meta = {
  title: 'Components/Sidebar',
  component: SidebarProvider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SidebarProvider className="min-h-[480px]">
      <Sidebar>
        <SidebarHeader>
          <span className="px-2 text-sm font-medium">Ledger Box</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<a href="#top" />}>
                      <Icon name={item.icon} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <span className="px-2 text-xs text-muted-foreground">v1.0.0</span>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b p-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Dashboard</span>
        </div>
        <div className="p-4 text-sm text-muted-foreground">Page content goes here.</div>
      </SidebarInset>
    </SidebarProvider>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Dashboard')).toBeVisible();
    await expect(canvas.getByText('Navigation')).toBeVisible();
    const trigger = canvas.getByRole('button', { name: 'Toggle Sidebar' });
    await userEvent.click(trigger);
    await expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'collapsed');
  },
  globals: {
    viewport: {
      value: 'desktop',
      isRotated: false,
    },
  },
};
