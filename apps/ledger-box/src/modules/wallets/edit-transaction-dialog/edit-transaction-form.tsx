import { Field as FormField, Form } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { CurrencyInput } from '@vhnam/ui/components/currency-input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';
import { Textarea } from '@vhnam/ui/components/textarea';
import { ToggleGroup, ToggleGroupItem } from '@vhnam/ui/components/toggle-group';
import { cn } from '@vhnam/ui/lib/utils';

import type { EditTransactionOutput } from '#/schemas/edit-transaction.schema';

import type { useEditTransactionDialogActions } from './edit-transaction-dialog.actions';

type EditTransactionFormProps = Pick<
  ReturnType<typeof useEditTransactionDialogActions>,
  'form' | 'isPending' | 'error'
> & {
  onSubmit: (output: EditTransactionOutput) => void;
};

function EditTransactionForm({ form, onSubmit, isPending, error }: EditTransactionFormProps) {
  return (
    <Form of={form} onSubmit={onSubmit} className="flex flex-col gap-4">
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
                disabled
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
                placeholder="Enter description"
                defaultValue={field.input}
                aria-invalid={!!field.errors}
                {...field.props}
              />
              {field.errors && <FieldError>{field.errors[0]}</FieldError>}
            </Field>
          )}
        />
      </FieldGroup>

      {error ? <FieldError>{error}</FieldError> : null}

      <Button type="submit" variant="default" size="lg" className="w-full" disabled={!form.isValid || isPending}>
        {isPending && <Spinner className="size-4" />}
        {isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </Form>
  );
}

export { EditTransactionForm };
