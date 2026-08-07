import { useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import { formatErrorMessage } from '#/lib/intl-message';
import { useDisconnectGoogle } from '#/queries/auth/auth.mutations';

type DisconnectGoogleDialogActionsProps = {
  accountId: string | undefined;
};

export function useDisconnectGoogleDialogActions({ accountId }: DisconnectGoogleDialogActionsProps) {
  const intl = useIntl();
  const { mutate: disconnectGoogle, isPending } = useDisconnectGoogle();
  const [error, setError] = useState<string | null>(null);

  function handleDisconnectGoogle(onSuccess: () => void) {
    if (!accountId) {
      return;
    }

    setError(null);

    disconnectGoogle(accountId, {
      onSuccess: () => {
        toast.add({
          title: intl.formatMessage({ id: 'toast.settings.googleDisconnected', defaultMessage: 'Google disconnected' }),
          type: 'success',
        });
        onSuccess();
      },
      onError: (disconnectError) => {
        const message =
          disconnectError instanceof Error
            ? disconnectError.message
            : 'settings.account.google.disconnectErrorFallback';
        setError(message);
        toast.add({
          title: intl.formatMessage({
            id: 'toast.settings.googleDisconnectFailed',
            defaultMessage: 'Failed to disconnect Google',
          }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  return { handleDisconnectGoogle, isPending, error };
}
