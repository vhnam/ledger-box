import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';

import { Icon, type IconName } from '@vhnam/ui/components/icon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
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
          <SidebarInput placeholder="Search" aria-label="Search" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupAction title="Add project">
              <Icon name="PlusIcon" />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<a href="#top" />} tooltip={index === 0 ? item.title : undefined}>
                      <Icon name={item.icon} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover title="More">
                      <Icon name="DotsThreeIcon" />
                    </SidebarMenuAction>
                    <SidebarMenuBadge>3</SidebarMenuBadge>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#sub" isActive>
                          Overview
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
        </SidebarContent>
        <SidebarFooter>
          <span className="px-2 text-xs text-muted-foreground">v1.0.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b p-4">
          <SidebarTrigger onClick={() => console.log('trigger clicked')} />
          <span className="text-sm font-medium">Dashboard</span>
        </div>
        <div className="p-4 text-sm text-muted-foreground">Page content goes here.</div>
      </SidebarInset>
    </SidebarProvider>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Dashboard')).toBeVisible();
    await expect(canvas.getByText('Navigation')).toBeVisible();
    const trigger = document.querySelector<HTMLButtonElement>('[data-slot="sidebar-trigger"]')!;
    await userEvent.click(trigger);
    await expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'collapsed');
    await userEvent.click(trigger);
    await expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'expanded');
    await userEvent.keyboard('{Meta>}b{/Meta}');
    await userEvent.keyboard('{Control>}b{/Control}');
  },
  globals: {
    viewport: {
      value: 'desktop',
      isRotated: false,
    },
  },
};

export const CollapsibleIcon: Story = {
  render: () => (
    <SidebarProvider className="min-h-[480px]" defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <span className="px-2 text-sm font-medium">Ledger Box</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<a href="#top" />} tooltip={item.title}>
                    <Icon name={item.icon} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
      </SidebarInset>
    </SidebarProvider>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'collapsed');
    const [homeButton] = canvas.getAllByText('Home');
    await userEvent.hover(homeButton);
  },
};

export const Controlled: Story = {
  render: () => {
    function ControlledSidebarDemo() {
      const [open, setOpen] = useState(true);

      return (
        <SidebarProvider className="min-h-[240px]" open={open} onOpenChange={setOpen}>
          <Sidebar>
            <SidebarContent>
              <span className="p-2 text-sm">Controlled content</span>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <SidebarTrigger />
          </SidebarInset>
        </SidebarProvider>
      );
    }

    return <ControlledSidebarDemo />;
  },
  play: async ({ canvas, userEvent }) => {
    await expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'expanded');
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle Sidebar' }));
    await expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'collapsed');
  },
};

export const NoneCollapsible: Story = {
  render: () => (
    <SidebarProvider className="min-h-[240px]">
      <Sidebar collapsible="none">
        <SidebarContent>
          <span className="p-2 text-sm">Always visible</span>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Always visible')).toBeVisible();
  },
};
