import { Link, useNavigate } from '@tanstack/react-router';
import { type SubmitEvent, useState } from 'react';

import { Button } from '@vhnam/ui/components/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

import { authClient } from '#/lib/auth-client';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
        <CardDescription>Enter your information below to create your account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                type="text"
                required
                value={name}
                placeholder="Enter your name"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={email}
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

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
        </form>
      </CardContent>
    </>
  );
}
