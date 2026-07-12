import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@vhnam/ui/components/button';
import { toast, Toaster } from '@vhnam/ui/components/sonner';

const meta = {
  title: 'Components/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Button onClick={() => toast('Wallet created')}>Show toast</Button>,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast.success('Wallet created')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info('Syncing wallets...')}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Balance is low')}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.error('Failed to save wallet')}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.loading('Saving wallet...')}>
        Loading
      </Button>
    </div>
  ),
};
