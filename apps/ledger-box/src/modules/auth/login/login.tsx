import { useNavigate } from '@tanstack/react-router';
import { type SubmitEvent, useState } from 'react';

import { Button } from '@vhnam/ui/components/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

import { authClient } from '#/lib/auth-client';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await authClient.signIn.email({ email, password });

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
        <CardTitle>Ledger Box</CardTitle>
        <CardDescription>Login to your account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
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
                Log in
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void handleGoogleSignIn()}>
                Continue with Google
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </>
  );
}
