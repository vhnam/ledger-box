import { reset, useForm } from '@formisch/react';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import { authClient } from '#/lib/auth-client';
import { changePasswordSchema } from '#/schemas/auth.schema';

export function useSettingsAccountActions() {
  const intl = useIntl();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({ schema: changePasswordSchema });

  async function handleChangePassword(
    output: { currentPassword: string; newPassword: string; confirmPassword: string },
    onSuccess?: () => void,
  ) {
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await authClient.changePassword({
      currentPassword: output.currentPassword,
      newPassword: output.newPassword,
      revokeOtherSessions: true,
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? 'settings.account.passwordUpdateErrorFallback');
      return;
    }

    reset(form);
    onSuccess?.();
    toast.add({
      title: intl.formatMessage({ id: 'toast.settings.passwordUpdated', defaultMessage: 'Password updated' }),
      description: intl.formatMessage({
        id: 'toast.settings.passwordUpdated.description',
        defaultMessage: 'Your password has been changed successfully.',
      }),
      type: 'success',
    });
  }

  return { form, error, isSubmitting, handleChangePassword };
}
