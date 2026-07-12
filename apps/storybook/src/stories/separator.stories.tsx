import type { Meta, StoryObj } from '@storybook/react-vite';

import { Separator } from '@vhnam/ui/components/separator';

const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64">
      <div className="text-sm">Above</div>
      <Separator {...args} className="my-3" />
      <div className="text-sm">Below</div>
    </div>
  ),
  args: {
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-8 items-center gap-3">
      <div className="text-sm">Left</div>
      <Separator {...args} />
      <div className="text-sm">Right</div>
    </div>
  ),
  args: {
    orientation: 'vertical',
  },
};
