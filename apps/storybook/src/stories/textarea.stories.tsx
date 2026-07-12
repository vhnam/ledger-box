import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from '@vhnam/ui/components/textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Hello world',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    placeholder: 'Invalid textarea',
    'aria-invalid': true,
  },
};
