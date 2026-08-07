import { Field as FormField, Form } from '@formisch/react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import { useLoginActions } from '#/modules/auth/login/login.actions';

export function LoginPage() {
  const intl = useIntl();
  const { form, error, isSubmitting, handleSubmit, handleGoogleSignIn } = useLoginActions();

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle>Ledger Box</CardTitle>
        <CardDescription>
          <FormattedMessage id="auth.login.description" defaultMessage="Login to your account" />
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form of={form} onSubmit={(output) => void handleSubmit(output)}>
          <FieldGroup>
            <FormField
              of={form}
              path={['email']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>
                    <FormattedMessage id="auth.login.email.label" defaultMessage="Email" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="email"
                    placeholder={intl.formatMessage({
                      id: 'auth.login.email.placeholder',
                      defaultMessage: 'Enter your email',
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
              path={['password']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>
                    <FormattedMessage id="auth.login.password.label" defaultMessage="Password" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    placeholder={intl.formatMessage({
                      id: 'auth.login.password.placeholder',
                      defaultMessage: 'Enter your password',
                    })}
                    defaultValue={field.input}
                    aria-invalid={!!field.errors}
                    {...field.props}
                  />
                  {field.errors && <FieldError>{formatErrorMessage(intl, field.errors[0])}</FieldError>}
                </Field>
              )}
            />

            {error ? <FieldError>{formatErrorMessage(intl, error)}</FieldError> : null}

            <Field>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                <FormattedMessage id="auth.login.submit" defaultMessage="Log in" />
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void handleGoogleSignIn()}>
                <FormattedMessage id="auth.login.google" defaultMessage="Continue with Google" />
              </Button>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </>
  );
}
