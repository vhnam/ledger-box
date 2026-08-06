import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SupportedLocale } from '@vhnam/utils/locale';

import { updateUserLocale } from '#/queries/user-settings/user-settings.api';
import { userLocaleQueryKey } from '#/queries/user-settings/user-settings.queries';

export function useUpdateUserLocale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locale: SupportedLocale) => updateUserLocale(locale),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userLocaleQueryKey });
    },
  });
}
