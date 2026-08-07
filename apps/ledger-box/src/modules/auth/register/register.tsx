import { Field as FormField, Form } from '@formisch/react';
import { Link } from '@tanstack/react-router';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

import { formatErrorMessage } from '#/lib/intl-message';

import { useRegisterActions } from '#/modules/auth/register/register.actions';

export function RegisterPage() {
  const intl = useIntl();
  const { form, error, isSubmitting, handleSubmit, handleGoogleSignIn } = useRegisterActions();

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle>
          <FormattedMessage id="auth.register.title" defaultMessage="Create an account" />
        </CardTitle>
        <CardDescription>
          <FormattedMessage
            id="auth.register.description"
            defaultMessage="Enter your information below to create your account"
          />
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form of={form} onSubmit={(output) => void handleSubmit(output)}>
          <FieldGroup>
            <FormField
              of={form}
              path={['name']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>
                    <FormattedMessage id="auth.register.name.label" defaultMessage="Name" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="text"
                    placeholder={intl.formatMessage({
                      id: 'auth.register.name.placeholder',
                      defaultMessage: 'Enter your name',
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
              path={['email']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>
                    <FormattedMessage id="auth.register.email.label" defaultMessage="Email" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="email"
                    placeholder={intl.formatMessage({
                      id: 'auth.register.email.placeholder',
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
                    <FormattedMessage id="auth.register.password.label" defaultMessage="Password" />
                  </FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    placeholder={intl.formatMessage({
                      id: 'auth.register.password.placeholder',
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
                <FormattedMessage id="auth.register.submit" defaultMessage="Create account" />
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void handleGoogleSignIn()}>
                <FormattedMessage id="auth.register.google" defaultMessage="Continue with Google" />
              </Button>
              <FieldDescription className="text-center">
                <FormattedMessage
                  id="auth.register.haveAccount"
                  defaultMessage="Already have an account? {loginLink}"
                  values={{
                    loginLink: (
                      <Link to="/auth/login" className="text-primary underline underline-offset-4">
                        <FormattedMessage id="auth.register.logInLink" defaultMessage="Log in" />
                      </Link>
                    ),
                  }}
                />
              </FieldDescription>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </>
  );
}
