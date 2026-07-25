import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@vhnam/ui/components/button';
import { toast, Toaster } from '@vhnam/ui/components/toast';

const meta = {
  title: 'Components/Toast',
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
  render: () => <Button onClick={() => toast.add({ title: 'Wallet created' })}>Show toast</Button>,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast.add({ title: 'Wallet created', type: 'success' })}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.add({ title: 'Syncing wallets...', type: 'info' })}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.add({ title: 'Balance is low', type: 'warning' })}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.add({ title: 'Failed to save wallet', type: 'error' })}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.add({ title: 'Saving wallet...', type: 'loading', timeout: 0 })}>
        Loading
      </Button>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.add({
          title: 'Wallet created',
          description: 'Your new wallet is ready to use.',
          type: 'success',
        })
      }
    >
      Show toast
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.add({
          title: 'Wallet deleted',
          description: 'This action can be undone.',
          type: 'error',
          actionProps: {
            children: 'Undo',
            onClick: () => toast.add({ title: 'Wallet restored', type: 'success' }),
          },
        })
      }
    >
      Show toast
    </Button>
  ),
};

export const WithPromise: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.promise(
          new Promise<string>((resolve) => {
            setTimeout(() => resolve('done'), 2000);
          }),
          {
            loading: 'Saving wallet...',
            success: 'Wallet saved',
            error: 'Failed to save wallet',
          },
        )
      }
    >
      Show promise toast
    </Button>
  ),
};
