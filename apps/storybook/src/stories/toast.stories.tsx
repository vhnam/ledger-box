import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

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
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    await waitFor(() => expect(within(document.body).getByText('Wallet created')).toBeVisible());
  },
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
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Success' }));
    await waitFor(() => expect(within(document.body).getByText('Wallet created')).toBeVisible());
    await userEvent.click(canvas.getByRole('button', { name: 'Info' }));
    await waitFor(() => expect(within(document.body).getByText('Syncing wallets...')).toBeVisible());
    await userEvent.click(canvas.getByRole('button', { name: 'Warning' }));
    await waitFor(() => expect(within(document.body).getByText('Balance is low')).toBeVisible());
    await userEvent.click(canvas.getByRole('button', { name: 'Error' }));
    await waitFor(() => expect(within(document.body).getByText('Failed to save wallet')).toBeVisible());
    await userEvent.click(canvas.getByRole('button', { name: 'Loading' }));
    await waitFor(() => expect(within(document.body).getByText('Saving wallet...')).toBeVisible());
  },
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
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    await waitFor(() => expect(within(document.body).getByText('Wallet deleted')).toBeVisible());
    await userEvent.click(within(document.body).getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(within(document.body).getByText('Wallet restored')).toBeVisible());
    const closeButtons = within(document.body).getAllByRole('button', { name: 'Close toast' });
    await userEvent.click(closeButtons[0]);
  },
};

export const WithPromise: Story = {
  parameters: {
    vitest: {
      disable: true,
    },
  },
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
