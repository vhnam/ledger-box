import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createStatementShare,
  downloadStatementPreviewCsv,
  previewStatementShare,
  revokeStatementShare,
} from '#/queries/statement-shares/statement-share.api';
import type { CreateStatementSharePayload } from '#/queries/statement-shares/statement-share.dto';

export function usePreviewStatementShare(walletId: string) {
  return useMutation({
    mutationFn: (payload: CreateStatementSharePayload) => previewStatementShare(walletId, payload),
  });
}

export function useDownloadStatementPreviewCsv(walletId: string) {
  return useMutation({
    mutationFn: (payload: CreateStatementSharePayload) => downloadStatementPreviewCsv(walletId, payload),
  });
}

export function useCreateStatementShare(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStatementSharePayload) => createStatementShare(walletId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets', walletId, 'statement-shares'] }),
        queryClient.invalidateQueries({ queryKey: ['activity', walletId] }),
      ]);
    },
  });
}

export function useRevokeStatementShare(walletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => revokeStatementShare(walletId, shareId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets', walletId, 'statement-shares'] }),
        queryClient.invalidateQueries({ queryKey: ['activity', walletId] }),
      ]);
    },
  });
}
