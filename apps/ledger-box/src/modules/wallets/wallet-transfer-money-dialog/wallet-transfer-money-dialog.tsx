import { Field as FormField, Form, isDirty } from '@formisch/react';
import { useMemo } from 'react';

import { Button } from '@vhnam/ui/components/button';
import { CurrencyInput } from '@vhnam/ui/components/currency-input';
import { DatePicker } from '@vhnam/ui/components/date-picker';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Input } from '@vhnam/ui/components/input';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';
import { Spinner } from '@vhnam/ui/components/spinner';
import { Textarea } from '@vhnam/ui/components/textarea';

import { useTransferMoneyDialogActions } from '#/modules/wallets/wallet-transfer-money-dialog/wallet-transfer-money-dialog.actions';
import { useWallets } from '#/queries/wallets/wallet.queries';
import type { TransferMoneyOutput } from '#/schemas/transfer-money.schema';

interface TransferMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
}

function TransferMoneyDialog({ open, onOpenChange, walletId }: TransferMoneyDialogProps) {
  const { data: wallets = [] } = useWallets();
  const walletOptions = useMemo(() => wallets.map((wallet) => ({ value: wallet.id, label: wallet.name })), [wallets]);
  const toWalletOptions = useMemo(
    () => walletOptions.filter((option) => option.value !== walletId),
    [walletId, walletOptions],
  );
  const fromWallet = wallets.find((wallet) => wallet.id === walletId);
  const fromWalletName = fromWallet?.name ?? '';
  const fromWalletCurrency = fromWallet?.currency ?? 'VND';
  const { form, handleOpenChange, handleTransfer, isPending, error } = useTransferMoneyDialogActions({
    open,
    walletId,
    wallets,
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    handleOpenChange(nextOpen);
    onOpenChange(nextOpen);
  }

  function handleSubmit(output: TransferMoneyOutput) {
    handleTransfer(output, () => {
      handleDialogOpenChange(false);
    });
  }

  function handleDismissAttempt() {
    if (window.confirm('Discard this transfer? Your changes will be lost.')) {
      handleDialogOpenChange(false);
    }
  }

  const titleContent = (
    <div className="flex items-center gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon name="ArrowsLeftRightIcon" />
      </div>
      Transfer Money
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      title={titleContent}
      preventDismiss={isDirty(form)}
      onDismissAttempt={handleDismissAttempt}
    >
      <Form of={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <div className="flex items-end gap-2">
            <FormField
              of={form}
              path={['fromWalletId']}
              children={(field) => <input type="hidden" {...field.props} value={field.input ?? ''} readOnly />}
            />
            <Field className="flex-1">
              <FieldLabel>From</FieldLabel>
              <Input name="fromWalletId" className="flex-1" disabled defaultValue={fromWalletName} />
            </Field>
            <Icon name="ArrowsLeftRightIcon" className="mb-2 shrink-0 text-muted-foreground" />
            <Field className="flex-1">
              <FieldLabel>To</FieldLabel>
              <FormField
                of={form}
                path={['toWalletId']}
                children={(field) => (
                  <>
                    <Select
                      name="toWalletId"
                      items={toWalletOptions}
                      value={field.input}
                      onValueChange={(value) => field.onChange(value ?? '')}
                    >
                      <SelectTrigger className="w-full" aria-invalid={!!field.errors}>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        {toWalletOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.errors && <FieldError>{field.errors[0]}</FieldError>}
                  </>
                )}
              />
            </Field>
          </div>

          <FormField
            of={form}
            path={['amount']}
            children={(field) => (
              <Field data-invalid={!!field.errors}>
                <FieldLabel htmlFor={field.props.name}>Amount</FieldLabel>
                <CurrencyInput
                  id={field.props.name}
                  value={field.input ?? ''}
                  currency={fromWalletCurrency}
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
            path={['note']}
            children={(field) => (
              <Field data-invalid={!!field.errors}>
                <FieldLabel htmlFor={field.props.name}>Note</FieldLabel>
                <Textarea
                  id={field.props.name}
                  defaultValue={field.input}
                  aria-invalid={!!field.errors}
                  placeholder="Enter a note for this transfer"
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
          {isPending ? 'Transferring...' : 'Confirm Transfer'}
        </Button>
      </Form>
    </ResponsiveDialog>
  );
}

export { TransferMoneyDialog };
