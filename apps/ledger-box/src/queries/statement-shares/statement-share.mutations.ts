import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createStatementShare,
  previewStatementShare,
  revokeStatementShare,
} from '#/queries/statement-shares/statement-share.api';
import type { CreateStatementSharePayload } from '#/queries/statement-shares/statement-share.dto';

export function usePreviewStatementShare(walletId: string) {
  return useMutation({
    mutationFn: (payload: CreateStatementSharePayload) => previewStatementShare(walletId, payload),
  });
}

export function useCreateStatementShare(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStatementSharePayload) => createStatementShare(walletId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets', walletId, 'statement-shares'] });
    },
  });
}

export function useRevokeStatementShare(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => revokeStatementShare(walletId, shareId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets', walletId, 'statement-shares'] });
    },
  });
}
