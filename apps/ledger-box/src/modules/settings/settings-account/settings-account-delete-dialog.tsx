import { Field as FormField, Form, reset } from '@formisch/react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Input } from '@vhnam/ui/components/input';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import { useDeleteAccountDialogActions } from '#/modules/settings/settings-account/settings-account-delete-dialog.actions';

type DeleteAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const intl = useIntl();
  const { form, error, isPending, handleDeleteAccount } = useDeleteAccountDialogActions();

  function handleSubmit(output: { password: string }) {
    handleDeleteAccount(output, () => onOpenChange(false));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(form);
    }

    onOpenChange(nextOpen);
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={intl.formatMessage({ id: 'settings.account.delete.title', defaultMessage: 'Delete account?' })}
      description={intl.formatMessage({
        id: 'settings.account.delete.body',
        defaultMessage: 'This will permanently delete your account and all of your wallets and transactions.',
      })}
      hideTitle
      hideDescription
      showCloseButton={false}
      headerClassName="sr-only"
      className="sm:max-w-md"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
          <Icon name="TrashIcon" className="size-6 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-medium">
            <FormattedMessage id="settings.account.delete.title" defaultMessage="Delete account?" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              id="settings.account.delete.body"
              defaultMessage="This will permanently delete your account and all of your wallets and transactions."
            />
            <br />
            <FormattedMessage id="common.cannotBeUndone" defaultMessage="This can't be undone." />
          </p>
        </div>

        <Form of={form} onSubmit={handleSubmit} className="w-full">
          <FieldGroup>
            <FormField
              of={form}
              path={['password']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name} className="sr-only">
                    <FormattedMessage id="settings.account.delete.password.label" defaultMessage="Confirm password" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    autoComplete="current-password"
                    placeholder={intl.formatMessage({
                      id: 'settings.account.delete.password.placeholder',
                      defaultMessage: 'Enter your password to confirm',
                    })}
                    defaultValue={field.input}
                    aria-invalid={!!field.errors}
                    {...field.props}
                  />
                  {field.errors && <FieldError>{formatErrorMessage(intl, field.errors[0])}</FieldError>}
                </Field>
              )}
            />

            {error && <FieldError>{formatErrorMessage(intl, error)}</FieldError>}

            <Field>
              <div className="flex w-full gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  <FormattedMessage id="common.cancel" defaultMessage="Cancel" />
                </Button>
                <Button type="submit" variant="destructive" className="flex-1" disabled={isPending}>
                  {isPending ? <Spinner className="size-4" /> : null}
                  {isPending ? (
                    <FormattedMessage id="common.deleting" defaultMessage="Deleting..." />
                  ) : (
                    <FormattedMessage id="settings.account.delete.cta" defaultMessage="Delete account" />
                  )}
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </Form>
      </div>
    </ResponsiveDialog>
  );
}

export { DeleteAccountDialog };
