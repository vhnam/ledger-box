import { Field as FormField, Form, isDirty, reset, useForm } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';
import { Spinner } from '@vhnam/ui/components/spinner';
import { toast } from '@vhnam/ui/components/toast';

import { useCreateWalletDialogActions } from '#/modules/wallets/wallet-create-dialog/wallet-create-dialog.actions';
import { createWalletSchema, WALLET_CURRENCIES, type CreateWalletSchema } from '#/schemas/wallet.schema';

const CURRENCY_OPTIONS = WALLET_CURRENCIES.map((currency) => ({ value: currency, label: currency }));

type CreateWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateWalletDialog({ open, onOpenChange }: CreateWalletDialogProps) {
  const { createWallet, isPending } = useCreateWalletDialogActions();
  const form = useForm({ schema: createWalletSchema, initialInput: { name: '', currency: 'VND' } });

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

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange} title="New wallet" preventDismiss={isDirty(form)}>
      <Form id="create-wallet-form" of={form} onSubmit={handleSubmit} className="space-y-6">
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

        <FormField
          of={form}
          path={['currency']}
          children={(field) => (
            <Field data-invalid={!!field.errors}>
              <FieldLabel htmlFor={field.props.name}>Currency</FieldLabel>
              <Select
                name={field.props.name}
                items={CURRENCY_OPTIONS}
                value={field.input}
                onValueChange={(value) => field.onChange(value ?? 'VND')}
              >
                <SelectTrigger className="w-full" aria-invalid={!!field.errors}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.errors && <FieldError>{field.errors[0]}</FieldError>}
            </Field>
          )}
        />

        <div className="flex flex-col-reverse lg:flex-row lg:justify-end gap-2">
          <Button type="button" size="lg" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-wallet-form" size="lg" disabled={isPending}>
            {isPending && <Spinner className="size-4" />}
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

export { CreateWalletDialog };
