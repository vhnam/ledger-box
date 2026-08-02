import { Field as FormField, Form, isDirty } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { CurrencyInput } from '@vhnam/ui/components/currency-input';
import { DatePicker } from '@vhnam/ui/components/date-picker';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';
import { Textarea } from '@vhnam/ui/components/textarea';
import { ToggleGroup, ToggleGroupItem } from '@vhnam/ui/components/toggle-group';
import { cn } from '@vhnam/ui/lib/utils';

import { useAddTransactionDialogActions } from '#/modules/wallets/wallet-add-transaction-dialog/wallet-add-transaction-dialog.actions';
import { useWallets } from '#/queries/wallets/wallet.queries';
import type { AddTransactionOutput } from '#/schemas/add-transaction.schema';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
}

function AddTransactionDialog({ open, onOpenChange, walletId }: AddTransactionDialogProps) {
  const { data: wallets = [] } = useWallets();
  const { form, handleOpenChange, handleAddTransaction, isPending, error } = useAddTransactionDialogActions({
    open,
    walletId,
    wallets,
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    handleOpenChange(nextOpen);
    onOpenChange(nextOpen);
  }

  function handleSubmit(output: AddTransactionOutput) {
    handleAddTransaction(output, () => {
      handleDialogOpenChange(false);
    });
  }

  function handleDismissAttempt() {
    if (window.confirm('Discard this transaction? Your changes will be lost.')) {
      handleDialogOpenChange(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      title="New Transaction"
      preventDismiss={isDirty(form)}
      onDismissAttempt={handleDismissAttempt}
    >
      <Form of={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <FormField
            of={form}
            path={['type']}
            children={(field) => (
              <Field data-invalid={!!field.errors}>
                <ToggleGroup
                  value={field.input ? [field.input] : []}
                  onValueChange={(values) => {
                    const nextValue = values.at(-1);
                    const nextType =
                      nextValue === 'income' || nextValue === 'expense' ? nextValue : (field.input ?? 'expense');
                    field.onChange(nextType);
                  }}
                  variant="outline"
                  spacing={0}
                  className="w-full rounded-xl bg-muted/50 p-1"
                >
                  <ToggleGroupItem
                    value="expense"
                    className={cn(
                      'flex-1 gap-1.5 rounded-lg border-0',
                      'aria-pressed:bg-rose-500 aria-pressed:text-white aria-pressed:hover:bg-rose-500',
                    )}
                  >
                    <Icon name="ArrowDownIcon" />
                    Expense
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="income"
                    className={cn(
                      'flex-1 gap-1.5 rounded-lg border-0',
                      'aria-pressed:bg-emerald-500 aria-pressed:text-white aria-pressed:hover:bg-emerald-500',
                    )}
                  >
                    <Icon name="ArrowUpIcon" />
                    Income
                  </ToggleGroupItem>
                </ToggleGroup>
                {field.errors && <FieldError>{field.errors[0]}</FieldError>}
              </Field>
            )}
          />

          <FormField
            of={form}
            path={['amount']}
            children={(field) => (
              <Field data-invalid={!!field.errors}>
                <FieldLabel htmlFor={field.props.name}>Amount</FieldLabel>
                <CurrencyInput
                  id={field.props.name}
                  value={field.input ?? ''}
                  aria-invalid={!!field.errors}
                  placeholder="Enter the amount"
                  name={field.props.name}
                  ref={field.props.ref}
                  onFocus={field.props.onFocus}
                  onBlur={field.props.onBlur}
                  onValueChange={field.onChange}
                />
                {field.errors && <FieldError>{field.errors[0]}</FieldError>}
              </Field>
            )}
          />

          <FormField
            of={form}
            path={['description']}
            children={(field) => (
              <Field data-invalid={!!field.errors}>
                <FieldLabel htmlFor={field.props.name}>Description</FieldLabel>
                <Textarea
                  id={field.props.name}
                  defaultValue={field.input}
                  aria-invalid={!!field.errors}
                  placeholder="What is this for?"
                  {...field.props}
                />
                {field.errors && <FieldError>{field.errors[0]}</FieldError>}
              </Field>
            )}
          />

          <FormField
            of={form}
            path={['occurredAt']}
            children={(field) => (
              <Field data-invalid={!!field.errors}>
                <FieldLabel htmlFor={field.props.name}>Date (optional)</FieldLabel>
                <DatePicker
                  id={field.props.name}
                  value={field.input ? new Date(field.input) : undefined}
                  placeholder="Today"
                  onChange={(date) => field.onChange(date ? date.toISOString().slice(0, 10) : undefined)}
                />
                {field.errors && <FieldError>{field.errors[0]}</FieldError>}
              </Field>
            )}
          />
        </FieldGroup>

        {error ? <FieldError>{error}</FieldError> : null}

        <Button type="submit" variant="default" size="lg" className="w-full" disabled={!form.isValid || isPending}>
          {isPending && <Spinner className="size-4" />}
          {isPending ? 'Adding...' : 'Add Transaction'}
        </Button>
      </Form>
    </ResponsiveDialog>
  );
}

export { AddTransactionDialog };
