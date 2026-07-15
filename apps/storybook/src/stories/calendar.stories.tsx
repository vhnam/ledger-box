import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

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
