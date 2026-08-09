import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createStatementShare,
  downloadStatementPreviewExport,
  previewStatementShare,
  revokeStatementShare,
  type StatementExportFormat,
} from '#/queries/statement-shares/statement-share.api';
import type { CreateStatementSharePayload } from '#/queries/statement-shares/statement-share.dto';

export function usePreviewStatementShare(walletId: string) {
  return useMutation({
    mutationFn: (payload: CreateStatementSharePayload) => previewStatementShare(walletId, payload),
  });
}

export function useDownloadStatementPreviewExport(walletId: string) {
  return useMutation({
    mutationFn: ({ payload, format }: { payload: CreateStatementSharePayload; format: StatementExportFormat }) =>
      downloadStatementPreviewExport(walletId, payload, format),
  });
}

/** CSV-only convenience wrapper around `useDownloadStatementPreviewExport`. */
export function useDownloadStatementPreviewCsv(walletId: string) {
  return useMutation({
    mutationFn: (payload: CreateStatementSharePayload) => downloadStatementPreviewExport(walletId, payload, 'csv'),
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
