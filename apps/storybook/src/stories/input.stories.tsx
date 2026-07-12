import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@vhnam/ui/components/input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Hello world',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    placeholder: 'Invalid input',
    'aria-invalid': true,
  },
};

export const File: Story = {
  args: {
    type: 'file',
  },
};
