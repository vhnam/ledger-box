import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { Button } from '@vhnam/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@vhnam/ui/components/dropdown-menu';

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline">Open menu</Button>} />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const menu = await waitFor(() => within(document.body).getByRole('menu'));
    await waitFor(() => expect(within(menu).getByText('My account')).toBeVisible());
    await userEvent.click(within(menu).getByText('Profile'));
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
  },
};

export const WithSubmenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline">Open menu</Button>} />
      <DropdownMenuContent>
        <DropdownMenuItem>New tab</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More tools</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Save page as...</DropdownMenuItem>
            <DropdownMenuItem>Create shortcut...</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const menu = await waitFor(() => within(document.body).getByRole('menu'));
    const subTrigger = within(menu).getByText('More tools');
    await userEvent.hover(subTrigger);
    await waitFor(() => expect(within(document.body).getByText('Save page as...')).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
  },
};

export const CheckboxesAndRadios: Story = {
  render: () => {
    function DropdownMenuDemo() {
      const [showStatusBar, setShowStatusBar] = useState(true);
      const [position, setPosition] = useState('bottom');

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline">View options</Button>} />
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
              Status bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
              <DropdownMenuLabel>Panel position</DropdownMenuLabel>
              <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return <DropdownMenuDemo />;
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'View options' }));
    const menu = await waitFor(() => within(document.body).getByRole('menu'));
    await userEvent.click(within(menu).getByText('Status bar'));
    await waitFor(() => expect(within(document.body).getByRole('menu')).toBeVisible());
    await userEvent.click(within(document.body).getByText('Top'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: 'View options' }));
    const menu2 = await waitFor(() => within(document.body).getByRole('menu'));
    await waitFor(() => expect(within(menu2).getByText('Panel position')).toBeVisible());
    await userEvent.keyboard('{Escape}');
  },
};
