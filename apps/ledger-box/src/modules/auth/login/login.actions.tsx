import { useForm } from '@formisch/react';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { loginSchema } from '#/schemas/auth.schema';

import { authClient } from '#/lib/auth-client';

export function useLoginActions() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({ schema: loginSchema });

  async function handleSubmit(output: { email: string; password: string }) {
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await authClient.signIn.email(output);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? 'auth.error.generic');
      return;
    }

    await navigate({ to: '/' });
  }

  async function handleGoogleSignIn() {
    await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
  }

  return { form, error, isSubmitting, handleSubmit, handleGoogleSignIn };
}
