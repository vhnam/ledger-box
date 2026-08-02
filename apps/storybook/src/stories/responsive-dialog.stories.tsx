import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';

const meta = {
  title: 'Components/ResponsiveDialog',
  component: ResponsiveDialog,
  args: {
    open: false,
    onOpenChange: () => {},
    title: 'Title',
    children: null,
  },
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResponsiveDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function FormExample() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="outline">Edit profile</Button>}
      title="Edit profile"
      description="Make changes to your profile here. Click save when you're done."
      footer={<Button onClick={() => setOpen(false)}>Save changes</Button>}
    >
      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="responsive-dialog-name">Name</FieldLabel>
          <Input id="responsive-dialog-name" defaultValue="Jane Doe" />
        </Field>
        <Field>
          <FieldLabel htmlFor="responsive-dialog-email">Email</FieldLabel>
          <Input id="responsive-dialog-email" defaultValue="jane@example.com" />
        </Field>
      </div>
    </ResponsiveDialog>
  );
}

/**
 * Renders as a Dialog on desktop viewports and a bottom Sheet below the mobile
 * breakpoint, behind the same props. Resize the viewport to see it switch.
 */
export const Default: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit profile' }));
    await waitFor(() => expect(within(document.body).getByRole('dialog')).toBeInTheDocument());
    await expect(within(document.body).getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
    await userEvent.click(within(document.body).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
  },
};

/** Below the mobile breakpoint, the same component renders as a bottom sheet. */
export const MobileViewport: Story = {
  render: () => <FormExample />,
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit profile' }));
    await waitFor(() => expect(within(document.body).getByRole('dialog')).toBeInTheDocument());
    const popup = within(document.body).getByRole('dialog');
    await expect(popup.getAttribute('data-side')).toBe('bottom');
    await userEvent.click(within(document.body).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
  },
};

function GuardedFormExample() {
  const [open, setOpen] = useState(false);
  const [blockedAttempts, setBlockedAttempts] = useState(0);

  return (
    <div className="flex flex-col items-center gap-2">
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="outline">New transaction</Button>}
        title="New transaction"
        preventDismiss
        onDismissAttempt={() => setBlockedAttempts((count) => count + 1)}
        footer={<Button onClick={() => setOpen(false)}>Save</Button>}
      >
        <Field>
          <FieldLabel htmlFor="responsive-dialog-amount">Amount</FieldLabel>
          <Input id="responsive-dialog-amount" defaultValue="120000" />
        </Field>
      </ResponsiveDialog>
      <p data-testid="blocked-count" className="text-sm text-muted-foreground">
        Blocked dismiss attempts: {blockedAttempts}
      </p>
    </div>
  );
}

/**
 * With `preventDismiss`, Escape (and backdrop/outside interaction) is blocked and
 * `onDismissAttempt` fires instead of closing — the dialog stays open because it's
 * controlled. The close button (an explicit action) still works.
 */
export const PreventDismissWhenDirty: Story = {
  render: () => <GuardedFormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New transaction' }));
    await waitFor(() => expect(within(document.body).getByRole('dialog')).toBeInTheDocument());

    await userEvent.keyboard('{Escape}');
    await expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
    await expect(canvas.getByTestId('blocked-count')).toHaveTextContent('Blocked dismiss attempts: 1');

    await userEvent.click(within(document.body).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
  },
};
