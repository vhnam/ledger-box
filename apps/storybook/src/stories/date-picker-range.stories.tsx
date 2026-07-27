import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';

const meta = {
  title: 'Components/DatePickerRange',
  component: DatePickerRange,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePickerRange>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Pick a date range',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Date range',
    placeholder: 'Pick a date range',
  },
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: {
      from: new Date(2026, 6, 1),
      to: new Date(2026, 6, 15),
    },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent('01/07/2026 - 15/07/2026');
    await userEvent.click(canvas.getByRole('button'));
    await waitFor(() => expect(within(document.body).getAllByRole('grid')[0]).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
  },
};

export const Disabled: Story = {
  args: {
    label: 'Date range',
    disabled: true,
  },
};

export const SingleMonth: Story = {
  args: {
    numberOfMonths: 1,
  },
};
