import type { Meta, StoryObj } from '@storybook/react-vite';

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
