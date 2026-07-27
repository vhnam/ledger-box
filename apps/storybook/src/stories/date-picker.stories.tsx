import type { Meta, StoryObj } from '@storybook/react-vite';

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
};

export const Disabled: Story = {
  args: {
    label: 'Date',
    disabled: true,
  },
};
