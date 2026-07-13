import { RiStarLine } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '@vhnam/ui/components/icon';
import { Toggle } from '@vhnam/ui/components/toggle';

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Toggle',
    variant: 'default',
    size: 'default',
  },
};

export const Outline: Story = {
  args: {
    children: 'Toggle',
    variant: 'outline',
  },
};

export const WithIcon: Story = {
  render: (args) => (
    <Toggle {...args}>
      <Icon icon={RiStarLine} />
    </Toggle>
  ),
  args: {
    variant: 'outline',
  },
};
