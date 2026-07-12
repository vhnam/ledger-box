import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';

import { Button } from '@vhnam/ui/components/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

import { authClient } from '#/lib/auth-client';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await authClient.signUp.email({ email, password, name });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? 'Something went wrong. Please try again.');
      return;
    }

    await navigate({ to: '/' });
  }

  async function handleGoogleSignIn() {
    await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" type="text" required value={name} onChange={(event) => setName(event.target.value)} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}

            <Field>
              <Button type="submit" disabled={isSubmitting}>
                Create account
              </Button>
            </Field>

            <FieldSeparator>or</FieldSeparator>

            <Field>
              <Button type="button" variant="outline" onClick={() => void handleGoogleSignIn()}>
                Continue with Google
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </>
  );
}
