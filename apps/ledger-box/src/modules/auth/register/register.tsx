import { Field as FormField, Form } from '@formisch/react';
import { Link } from '@tanstack/react-router';

import { Button } from '@vhnam/ui/components/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

import { useRegisterActions } from './register.actions';

export function RegisterPage() {
  const { form, error, isSubmitting, handleSubmit, handleGoogleSignIn } = useRegisterActions();

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your information below to create your account</CardDescription>
      </CardHeader>

      <CardContent>
        <Form of={form} onSubmit={(output) => void handleSubmit(output)}>
          <FieldGroup>
            <FormField
              of={form}
              path={['name']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>Name</FieldLabel>
                  <Input
                    id={field.props.name}
                    type="text"
                    placeholder="Enter your name"
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
              path={['email']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>Email</FieldLabel>
                  <Input
                    id={field.props.name}
                    type="email"
                    placeholder="Enter your email"
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
              path={['password']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>Password</FieldLabel>
                  <Input
                    id={field.props.name}
                    type="password"
                    placeholder="Enter your password"
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
              <Button type="submit" size="lg" disabled={isSubmitting}>
                Create account
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void handleGoogleSignIn()}>
                Continue with Google
              </Button>
              <FieldDescription className="text-center">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-primary underline underline-offset-4">
                  Log in
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </>
  );
}
