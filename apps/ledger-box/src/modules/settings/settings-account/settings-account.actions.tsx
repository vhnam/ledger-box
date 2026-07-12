import { reset, useForm } from '@formisch/react';
import { useState } from 'react';

import { toast } from '@vhnam/ui/components/sonner';

import { authClient } from '#/lib/auth-client';
import { changePasswordSchema } from '#/schemas/auth.schema';

export function useSettingsAccountActions() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({ schema: changePasswordSchema });

  async function handleChangePassword(output: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await authClient.changePassword({
      currentPassword: output.currentPassword,
      newPassword: output.newPassword,
      revokeOtherSessions: true,
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? 'Failed to update password. Please try again.');
      return;
    }

    reset(form);
    toast.success('Password updated', {
      description: 'Your password has been changed successfully.',
    });
  }

  return { form, error, isSubmitting, handleChangePassword };
}
