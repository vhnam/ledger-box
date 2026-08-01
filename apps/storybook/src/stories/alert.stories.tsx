import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@vhnam/ui/components/alert';
import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeInTheDocument();
    await expect(canvas.getByText('Heads up')).toBeVisible();
  },
};

export const Destructive: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive" className="w-96">
      <AlertTitle>Delete this wallet</AlertTitle>
      <AlertDescription>
        Once you delete a wallet, there is no going back. All of its transactions will be permanently deleted.
      </AlertDescription>
    </Alert>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <Icon name="WarningCircleIcon" />
      <AlertTitle>Check your invite settings</AlertTitle>
      <AlertDescription>Pending invites expire after 7 days if they are not accepted.</AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive" className="w-96">
      <AlertTitle>Delete this wallet</AlertTitle>
      <AlertDescription>
        Once you delete a wallet, there is no going back. All of its transactions will be permanently deleted.
      </AlertDescription>
      <AlertAction>
        <Button size="xs" type="button" variant="destructive">
          Delete wallet
        </Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Delete wallet' });
    await userEvent.click(button);
    await expect(button).toBeInTheDocument();
  },
};
