import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@vhnam/ui/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@vhnam/ui/components/empty';
import { Icon } from '@vhnam/ui/components/icon';

const meta = {
  title: 'Components/Empty',
  component: Empty,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Empty className="w-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name="WalletIcon" />
        </EmptyMedia>
        <EmptyTitle>No wallets yet</EmptyTitle>
        <EmptyDescription>Create your first wallet to start tracking your transactions.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Create wallet</Button>
      </EmptyContent>
    </Empty>
  ),
};
