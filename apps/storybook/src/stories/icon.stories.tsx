import { RiHeartFill, RiSettings4Line, RiUser3Line } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '@vhnam/ui/components/icon';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: RiUser3Line,
  },
};

export const CustomSize: Story = {
  args: {
    icon: RiSettings4Line,
    className: 'size-8',
  },
};

export const CustomColor: Story = {
  args: {
    icon: RiHeartFill,
    className: 'text-destructive',
  },
};

export const Gallery: Story = {
  args: {
    icon: RiUser3Line,
  },
  render: () => (
    <div className="flex items-center gap-4">
      <Icon icon={RiUser3Line} />
      <Icon icon={RiSettings4Line} />
      <Icon icon={RiHeartFill} className="text-destructive" />
    </div>
  ),
};
