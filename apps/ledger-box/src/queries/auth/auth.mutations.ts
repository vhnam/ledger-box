import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authClient } from '#/lib/auth-client';

import { linkedAccountsQueryKey } from '#/queries/auth/auth.queries';

export function useConnectGoogle() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.linkSocial({ provider: 'google', callbackURL: window.location.pathname });

      if (error) {
        throw new Error(error.message ?? 'settings.account.google.connectErrorFallback');
      }
    },
  });
}

export function useDisconnectGoogle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await authClient.unlinkAccount({ providerId: 'google', accountId });

      if (error) {
        throw new Error(error.message ?? 'settings.account.google.disconnectErrorFallback');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: linkedAccountsQueryKey });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await authClient.deleteUser({ password });

      if (error) {
        throw new Error(error.message ?? 'settings.account.delete.errorFallback');
      }
    },
  });
}
