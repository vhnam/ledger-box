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
    name: 'UserIcon',
  },
};

export const CustomSize: Story = {
  args: {
    name: 'GearIcon',
    className: 'size-8',
  },
};

export const CustomColor: Story = {
  args: {
    name: 'HeartIcon',
    weight: 'fill',
    className: 'text-destructive',
  },
};

export const Gallery: Story = {
  args: {
    name: 'UserIcon',
  },
  render: () => (
    <div className="flex items-center gap-4">
      <Icon name="UserIcon" />
      <Icon name="GearIcon" />
      <Icon name="HeartIcon" weight="fill" className="text-destructive" />
    </div>
  ),
};
