import { Field as FormField, Form, reset, useForm } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@vhnam/ui/components/dialog';
import { Field, FieldError, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { createWalletSchema } from '#/schemas/wallet.schema';

import { useCreateWalletDialogActions } from './create-wallet-dialog.actions';

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New wallet</DialogTitle>
        </DialogHeader>
        <Form
          of={form}
          onSubmit={(output) => {
            createWallet(output.name, {
              onSuccess: () => {
                handleOpenChange(false);
              },
            });
          }}
        >
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

          <DialogFooter>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending && <Spinner className="size-4" />}
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { CreateWalletDialog };
