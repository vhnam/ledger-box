import { Field as FormField, Form, isDirty, reset, useForm } from '@formisch/react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';
import { Spinner } from '@vhnam/ui/components/spinner';
import { toast } from '@vhnam/ui/components/toast';

import { createWalletSchema, WALLET_CURRENCIES, type CreateWalletSchema } from '#/schemas/wallet.schema';

import { formatErrorMessage } from '#/lib/intl-message';

import { useCreateWalletDialogActions } from '#/modules/wallets/wallet-create-dialog/wallet-create-dialog.actions';

const CURRENCY_OPTIONS = WALLET_CURRENCIES.map((currency) => ({ value: currency, label: currency }));

type CreateWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateWalletDialog({ open, onOpenChange }: CreateWalletDialogProps) {
  const intl = useIntl();
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
        toast.add({
          title: intl.formatMessage({ id: 'toast.wallet.created', defaultMessage: 'Wallet created' }),
          type: 'success',
        });
      },
    });
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={intl.formatMessage({ id: 'wallet.create.title', defaultMessage: 'New wallet' })}
      preventDismiss={isDirty(form)}
    >
      <Form id="create-wallet-form" of={form} onSubmit={handleSubmit} className="space-y-6">
        <FormField
          of={form}
          path={['name']}
          children={(field) => (
            <Field data-invalid={!!field.errors}>
              <FieldLabel htmlFor={field.props.name}>
                <FormattedMessage id="wallet.create.name.label" defaultMessage="Wallet name" />
              </FieldLabel>
              <Input
                id={field.props.name}
                placeholder={intl.formatMessage({
                  id: 'wallet.create.name.placeholder',
                  defaultMessage: 'Enter wallet name',
                })}
                defaultValue={field.input}
                aria-invalid={!!field.errors}
                {...field.props}
              />
              {field.errors && <FieldError>{formatErrorMessage(intl, field.errors[0])}</FieldError>}
            </Field>
          )}
        />

        <FormField
          of={form}
          path={['currency']}
          children={(field) => (
            <Field data-invalid={!!field.errors}>
              <FieldLabel htmlFor={field.props.name}>
                <FormattedMessage id="wallet.create.currency.label" defaultMessage="Currency" />
              </FieldLabel>
              <Select
                name={field.props.name}
                items={CURRENCY_OPTIONS}
                value={field.input}
                onValueChange={(value) => field.onChange(value ?? 'VND')}
              >
                <SelectTrigger className="w-full" aria-invalid={!!field.errors}>
                  <SelectValue
                    placeholder={intl.formatMessage({
                      id: 'wallet.create.currency.placeholder',
                      defaultMessage: 'Select currency',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.errors && <FieldError>{formatErrorMessage(intl, field.errors[0])}</FieldError>}
            </Field>
          )}
        />

        <div className="flex flex-col-reverse lg:flex-row lg:justify-end gap-2">
          <Button type="button" size="lg" variant="outline" onClick={() => handleOpenChange(false)}>
            <FormattedMessage id="common.cancel" defaultMessage="Cancel" />
          </Button>
          <Button type="submit" form="create-wallet-form" size="lg" disabled={isPending}>
            {isPending && <Spinner className="size-4" />}
            {isPending ? (
              <FormattedMessage id="common.creating" defaultMessage="Creating..." />
            ) : (
              <FormattedMessage id="common.create" defaultMessage="Create" />
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

export { CreateWalletDialog };
