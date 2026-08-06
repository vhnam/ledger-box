import { Field as FormField, Form } from '@formisch/react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/intl-message';
import { useSettingsAccountActions } from '#/modules/settings/settings-account/settings-account.actions';

function SettingsAccount() {
  const { form, error, isSubmitting, handleChangePassword } = useSettingsAccountActions();
  const intl = useIntl();

  return (
    <div className="flex flex-col gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-medium">
          <FormattedMessage id="settings.account.title" defaultMessage="Account" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage id="settings.account.description" defaultMessage="Manage your account settings." />
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-sm font-medium">
            <FormattedMessage id="settings.account.changePassword.title" defaultMessage="Change password" />
          </h3>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              id="settings.account.changePassword.description"
              defaultMessage="Update your password to keep your account secure."
            />
          </p>
        </div>

        <Form of={form} onSubmit={(output) => void handleChangePassword(output)}>
          <FieldGroup>
            <FormField
              of={form}
              path={['currentPassword']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>
                    <FormattedMessage id="settings.account.currentPassword.label" defaultMessage="Current password" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    autoComplete="current-password"
                    placeholder={intl.formatMessage({
                      id: 'settings.account.currentPassword.placeholder',
                      defaultMessage: 'Enter your current password',
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
              path={['newPassword']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>
                    <FormattedMessage id="settings.account.newPassword.label" defaultMessage="New password" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder={intl.formatMessage({
                      id: 'settings.account.newPassword.placeholder',
                      defaultMessage: 'Enter your new password',
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
              path={['confirmPassword']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>
                    <FormattedMessage
                      id="settings.account.confirmPassword.label"
                      defaultMessage="Confirm new password"
                    />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder={intl.formatMessage({
                      id: 'settings.account.confirmPassword.placeholder',
                      defaultMessage: 'Confirm your new password',
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="size-4" />}
                {isSubmitting ? (
                  <FormattedMessage id="settings.account.submitting" defaultMessage="Updating..." />
                ) : (
                  <FormattedMessage id="settings.account.submit" defaultMessage="Update password" />
                )}
              </Button>
            </Field>
          </FieldGroup>
        </Form>
      </div>
    </div>
  );
}

export { SettingsAccount };
