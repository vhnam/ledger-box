import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createWallet } from './wallet.api';

export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWallet,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}
