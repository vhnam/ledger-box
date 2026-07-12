import { Field as FormField, Form } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { useSettingsAccountActions } from './settings-account.actions';

function SettingsAccount() {
  const { form, error, isSubmitting, handleChangePassword } = useSettingsAccountActions();

  return (
    <div className="flex flex-col gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">Account</h2>
        <p className="text-sm text-muted-foreground">Manage your account settings.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">Change password</h3>
          <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
        </div>

        <Form of={form} onSubmit={(output) => void handleChangePassword(output)}>
          <FieldGroup>
            <FormField
              of={form}
              path={['currentPassword']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>Current password</FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your current password"
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
              path={['newPassword']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>New password</FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter your new password"
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
              path={['confirmPassword']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>Confirm new password</FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    defaultValue={field.input}
                    aria-invalid={!!field.errors}
                    {...field.props}
                  />
                  {field.errors && <FieldError>{field.errors[0]}</FieldError>}
                </Field>
              )}
            />

            {error && <FieldError>{error}</FieldError>}

            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="size-4" />}
                {isSubmitting ? 'Updating...' : 'Update password'}
              </Button>
            </Field>
          </FieldGroup>
        </Form>
      </div>
    </div>
  );
}

export { SettingsAccount };
