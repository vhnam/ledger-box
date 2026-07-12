import { Field as FormField, Form, reset, useForm } from '@formisch/react';
import { RiAddLine } from '@remixicon/react';
import { useState } from 'react';

import { Button } from '@vhnam/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@vhnam/ui/components/dialog';
import { Field, FieldError, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { createWalletSchema } from '#/schemas/wallet.schema';

import { useCreateWalletDialogActions } from './create-wallet-dialog.actions';

export function CreateWalletDialog() {
  const [open, setOpen] = useState(false);
  const { createWallet, isPending } = useCreateWalletDialogActions();
  const form = useForm({ schema: createWalletSchema });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full border-dashed">
            <Icon icon={RiAddLine} />
            <span>New wallet</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New wallet</DialogTitle>
        </DialogHeader>
        <Form
          of={form}
          onSubmit={(output) => {
            createWallet(output.name, {
              onSuccess: () => {
                setOpen(false);
                reset(form);
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
