import { Field as FormField, Form } from '@formisch/react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import { useSettingsAccountActions } from '#/modules/settings/settings-account/settings-account.actions';

type ChangePasswordFormProps = {
  onSuccess: () => void;
};

function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const intl = useIntl();
  const { form, error, isSubmitting, handleChangePassword } = useSettingsAccountActions();

  function handleSubmit(output: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    void handleChangePassword(output, onSuccess);
  }

  return (
    <Form of={form} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="lg:max-w-md space-y-6">
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
                  <FormattedMessage id="settings.account.confirmPassword.label" defaultMessage="Confirm new password" />
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
        </div>

        {error && <FieldError>{formatErrorMessage(intl, error)}</FieldError>}

        <Field>
          <p className="text-xs text-muted-foreground">
            <FormattedMessage
              id="settings.account.passwordRequirements"
              defaultMessage="Make sure it's at least 15 characters OR at least 8 characters including a number and a lowercase letter."
            />{' '}
            <a href="#" className="px-1 text-accent-foreground underline hover:text-accent-foreground/80">
              <FormattedMessage id="settings.account.passwordRequirements.learnMore" defaultMessage="Learn more" />
            </a>
            .
          </p>
          <div className="space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4" />}
              {isSubmitting ? (
                <FormattedMessage id="settings.account.submitting" defaultMessage="Updating..." />
              ) : (
                <FormattedMessage id="settings.account.submit" defaultMessage="Update password" />
              )}
            </Button>
            <Button variant="link">
              <FormattedMessage id="settings.account.forgotPassword" defaultMessage="I forgot my password" />
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </Form>
  );
}

export { ChangePasswordForm };
