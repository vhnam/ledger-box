import { Field as FormField, Form } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

import { useLoginActions } from './login.actions';

export function LoginPage() {
  const { form, error, isSubmitting, handleSubmit, handleGoogleSignIn } = useLoginActions();

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle>Ledger Box</CardTitle>
        <CardDescription>Login to your account</CardDescription>
      </CardHeader>

      <CardContent>
        <Form of={form} onSubmit={(output) => void handleSubmit(output)}>
          <FieldGroup>
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
                Log in
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void handleGoogleSignIn()}>
                Continue with Google
              </Button>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </>
  );
}
