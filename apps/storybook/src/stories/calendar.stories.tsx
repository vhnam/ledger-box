import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';

import { Calendar } from '@vhnam/ui/components/calendar';
import type { DatePickerRangeValue } from '@vhnam/ui/components/date-picker-range';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function CalendarDemo() {
      const [date, setDate] = useState<Date | undefined>(new Date());

      return <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border" />;
    }

    return <CalendarDemo />;
  },
  play: async ({ canvas, userEvent }) => {
    const nextButton = canvas.getByRole('button', { name: /next/i });
    const previousButton = canvas.getByRole('button', { name: /previous/i });
    await userEvent.click(nextButton);
    await userEvent.click(previousButton);
    await userEvent.click(previousButton);
    await userEvent.click(nextButton);
  },
};

export const DropdownCaption: Story = {
  render: () => {
    function CalendarDropdownDemo() {
      const [date, setDate] = useState<Date | undefined>(new Date());

      return (
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={date}
          onSelect={setDate}
          className="rounded-lg border"
        />
      );
    }

    return <CalendarDropdownDemo />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: /month/i })).toBeInTheDocument();
  },
};

export const Range: Story = {
  render: () => {
    function CalendarRangeDemo() {
      const [range, setRange] = useState<DatePickerRangeValue | undefined>(undefined);

      return (
        <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} className="rounded-lg border" />
      );
    }

    return <CalendarRangeDemo />;
  },
};

export const Disabled: Story = {
  render: () => <Calendar mode="single" disabled className="rounded-lg border" />,
};

export const WithWeekNumbers: Story = {
  render: () => <Calendar mode="single" showWeekNumber className="rounded-lg border" />,
  parameters: {
    // react-day-picker's built-in week-number <td scope="row"> is a library-level
    // a11y quirk unrelated to this component; not worth overriding upstream markup for.
    a11y: {
      test: 'off',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('grid')).toBeVisible();
  },
};
