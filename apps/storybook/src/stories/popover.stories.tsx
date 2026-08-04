import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { Button } from '@vhnam/ui/components/button';
import { Input } from '@vhnam/ui/components/input';
import { Label } from '@vhnam/ui/components/label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@vhnam/ui/components/popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-2">
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="width">Width</Label>
            <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="height">Height</Label>
            <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open popover' }));
    await waitFor(() => expect(within(document.body).getByText('Dimensions')).toBeVisible());
    await expect(within(document.body).getByText('Set the dimensions for the layer.')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByText('Dimensions')).toBeNull());
  },
};

export const Simple: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open</Button>} />
      <PopoverContent>
        <p>This is a simple popover with just some text content.</p>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await waitFor(() =>
      expect(within(document.body).getByText('This is a simple popover with just some text content.')).toBeVisible(),
    );
    await userEvent.click(document.body);
    await waitFor(() =>
      expect(within(document.body).queryByText('This is a simple popover with just some text content.')).toBeNull(),
    );
  },
};
