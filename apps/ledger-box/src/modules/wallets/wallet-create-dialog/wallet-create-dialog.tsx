import { Field as FormField, Form, isDirty, reset, useForm } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';
import { toast } from '@vhnam/ui/components/toast';

import { useCreateWalletDialogActions } from '#/modules/wallets/wallet-create-dialog/wallet-create-dialog.actions';
import { createWalletSchema, type CreateWalletSchema } from '#/schemas/wallet.schema';

type CreateWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateWalletDialog({ open, onOpenChange }: CreateWalletDialogProps) {
  const { createWallet, isPending } = useCreateWalletDialogActions();
  const form = useForm({ schema: createWalletSchema });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(form);
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit(payload: CreateWalletSchema) {
    createWallet(payload, {
      onSuccess: () => {
        handleOpenChange(false);
        toast.add({ title: 'Wallet created', type: 'success' });
      },
    });
  }

  function handleDismissAttempt() {
    if (window.confirm('Discard this wallet? Your changes will be lost.')) {
      handleOpenChange(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="New wallet"
      preventDismiss={isDirty(form)}
      onDismissAttempt={handleDismissAttempt}
      footer={
        <Button type="submit" form="create-wallet-form" size="lg" disabled={isPending}>
          {isPending && <Spinner className="size-4" />}
          {isPending ? 'Creating...' : 'Create'}
        </Button>
      }
    >
      <Form id="create-wallet-form" of={form} onSubmit={handleSubmit}>
        <FormField
          of={form}
          path={['name']}
          children={(field) => (
            <Field data-invalid={!!field.errors}>
              <FieldLabel htmlFor={field.props.name}>Wallet name</FieldLabel>
              <Input
                id={field.props.name}
                placeholder="Enter wallet name"
                defaultValue={field.input}
                aria-invalid={!!field.errors}
                {...field.props}
              />
              {field.errors && <FieldError>{field.errors[0]}</FieldError>}
            </Field>
          )}
        />
      </Form>
    </ResponsiveDialog>
  );
}

export { CreateWalletDialog };
