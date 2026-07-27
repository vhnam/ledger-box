import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { DatePicker } from '@vhnam/ui/components/date-picker';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Pick a date',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Date',
    placeholder: 'Pick a date',
  },
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: new Date(2026, 6, 15),
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent('15/07/2026');
    await userEvent.click(canvas.getByRole('button'));
    await waitFor(() => expect(within(document.body).getByRole('grid')).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
  },
};

export const Disabled: Story = {
  args: {
    label: 'Date',
    disabled: true,
  },
};
