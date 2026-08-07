import { useForm } from '@formisch/react';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import { authClient } from '#/lib/auth-client';
import { formatErrorMessage } from '#/lib/intl-message';
import { useDeleteAccount } from '#/queries/auth/auth.mutations';
import { deleteAccountSchema } from '#/schemas/auth.schema';

export function useDeleteAccountDialogActions() {
  const intl = useIntl();
  const navigate = useNavigate();
  const form = useForm({ schema: deleteAccountSchema });
  const { mutate: deleteAccount, isPending } = useDeleteAccount();
  const [error, setError] = useState<string | null>(null);

  function handleDeleteAccount(output: { password: string }, onSuccess: () => void) {
    setError(null);

    deleteAccount(output.password, {
      onSuccess: async () => {
        toast.add({
          title: intl.formatMessage({ id: 'toast.settings.accountDeleted', defaultMessage: 'Account deleted' }),
          type: 'success',
        });
        onSuccess();
        await authClient.signOut();
        await navigate({ to: '/auth/login' });
      },
      onError: (deleteError) => {
        const message = deleteError instanceof Error ? deleteError.message : 'settings.account.delete.errorFallback';
        setError(message);
        toast.add({
          title: intl.formatMessage({
            id: 'toast.settings.accountDeleteFailed',
            defaultMessage: 'Failed to delete account',
          }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  return { form, handleDeleteAccount, isPending, error };
}
