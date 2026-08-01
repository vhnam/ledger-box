import { useState } from 'react';

import { toast } from '@vhnam/ui/components/toast';

import type {
  CreateStatementSharePayload,
  CreateStatementShareResponse,
  StatementSnapshotDto,
} from '#/queries/statement-shares/statement-share.dto';
import {
  useCreateStatementShare,
  useDownloadStatementPreviewCsv,
  usePreviewStatementShare,
  useRevokeStatementShare,
} from '#/queries/statement-shares/statement-share.mutations';
import { useStatementShares } from '#/queries/statement-shares/statement-share.queries';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

type UseWalletSettingsStatementSharesOptions = {
  wallet: WalletDto;
};

export function useWalletSettingsStatementSharesActions({ wallet }: UseWalletSettingsStatementSharesOptions) {
  const { data: shares = [], isPending: isLoadingShares } = useStatementShares(wallet.id);
  const { mutate: preview, isPending: isPreviewing } = usePreviewStatementShare(wallet.id);
  const { mutate: createShare, isPending: isCreating } = useCreateStatementShare(wallet.id);
  const { mutate: revokeShare } = useRevokeStatementShare(wallet.id);
  const { mutate: downloadCsv, isPending: isDownloading } = useDownloadStatementPreviewCsv(wallet.id);

  const [periodFrom, setPeriodFrom] = useState<string | undefined>(undefined);
  const [periodTo, setPeriodTo] = useState<string | undefined>(undefined);
  const [displayTitle, setDisplayTitle] = useState('');
  const [previewSnapshot, setPreviewSnapshot] = useState<StatementSnapshotDto | null>(null);
  const [createdLink, setCreatedLink] = useState<CreateStatementShareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function buildPayload(): CreateStatementSharePayload | null {
    if (!periodFrom || !periodTo) {
      setError('Pick a start and end date');
      return null;
    }

    return {
      periodFrom,
      periodTo,
      displayTitle: displayTitle.trim() || undefined,
    };
  }

  function handlePreview() {
    setError(null);
    const payload = buildPayload();

    if (!payload) {
      return;
    }

    preview(payload, {
      onSuccess: (response) => setPreviewSnapshot(response.preview),
      onError: (previewError) => {
        const message = previewError instanceof Error ? previewError.message : 'Failed to preview statement.';
        setError(message);
      },
    });
  }

  function handleDownloadCsv() {
    setError(null);
    const payload = buildPayload();

    if (!payload) {
      return;
    }

    downloadCsv(payload, {
      onSuccess: ({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      },
      onError: (downloadError) => {
        const message = downloadError instanceof Error ? downloadError.message : 'Failed to download statement.';
        setError(message);
      },
    });
  }

  function handleCreate() {
    setError(null);
    const payload = buildPayload();

    if (!payload) {
      return;
    }

    createShare(payload, {
      onSuccess: (response) => {
        setCreatedLink(response);
        setPreviewSnapshot(null);
        toast.add({ title: 'Share link created', type: 'success' });
      },
      onError: (createError) => {
        const message = createError instanceof Error ? createError.message : 'Failed to create share link.';
        setError(message);
        toast.add({ title: 'Failed to create share link', description: message, type: 'error' });
      },
    });
  }

  function handleRevoke(shareId: string) {
    revokeShare(shareId, {
      onSuccess: () => toast.add({ title: 'Share link revoked', type: 'success' }),
      onError: (revokeError) => {
        const message = revokeError instanceof Error ? revokeError.message : 'Failed to revoke share link.';
        toast.add({ title: 'Failed to revoke share link', description: message, type: 'error' });
      },
    });
  }

  function resetCreateFlow() {
    setPeriodFrom(undefined);
    setPeriodTo(undefined);
    setDisplayTitle('');
    setPreviewSnapshot(null);
    setCreatedLink(null);
    setError(null);
  }

  return {
    shares,
    isLoadingShares,
    periodFrom,
    setPeriodFrom,
    periodTo,
    setPeriodTo,
    displayTitle,
    setDisplayTitle,
    previewSnapshot,
    createdLink,
    error,
    isPreviewing,
    isCreating,
    isDownloading,
    handlePreview,
    handleCreate,
    handleDownloadCsv,
    handleRevoke,
    resetCreateFlow,
  };
}
