import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
    const grid = await waitFor(() => within(document.body).getByRole('grid'));
    await expect(grid).toBeVisible();
    const day = within(document.body).getByRole('gridcell', { name: '20' });
    await userEvent.click(day.querySelector('button') ?? day);
    await waitFor(() => expect(canvas.getByRole('button')).toHaveTextContent('20/07/2026'));
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

export const Controlled: Story = {
  render: () => {
    function ControlledDemo() {
      const [date, setDate] = useState<Date | undefined>(new Date(2026, 6, 1));

      return <DatePicker label="Date" value={date} onChange={setDate} />;
    }

    return <ControlledDemo />;
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent('01/07/2026');
    await userEvent.click(canvas.getByRole('button'));
    await waitFor(() => expect(within(document.body).getByRole('grid')).toBeVisible());
    const day = within(document.body).getByRole('gridcell', { name: '10' });
    await userEvent.click(day.querySelector('button') ?? day);
    await waitFor(() => expect(canvas.getByRole('button')).toHaveTextContent('10/07/2026'));
  },
};
