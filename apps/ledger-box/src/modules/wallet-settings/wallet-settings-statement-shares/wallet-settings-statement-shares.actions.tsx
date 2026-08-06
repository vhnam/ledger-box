import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import { formatErrorMessage } from '#/lib/intl-message';
import { getPageItems } from '#/lib/pagination';
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
  const intl = useIntl();
  const [page, setPage] = useState(1);
  const { data, isPending: isLoadingShares, isFetching: isFetchingShares } = useStatementShares(wallet.id, page);
  const shares = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  }

  function goToPreviousPage() {
    goToPage(page - 1);
  }

  function goToNextPage() {
    goToPage(page + 1);
  }

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
      setError('validation.share.period.required');
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
        const message =
          previewError instanceof Error ? previewError.message : 'wallet.settings.shares.previewErrorFallback';
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
        const message =
          downloadError instanceof Error ? downloadError.message : 'wallet.settings.shares.downloadErrorFallback';
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
        toast.add({
          title: intl.formatMessage({ id: 'toast.shares.created', defaultMessage: 'Share link created' }),
          type: 'success',
        });
      },
      onError: (createError) => {
        const message = createError instanceof Error ? createError.message : 'toast.shares.createErrorFallback';
        setError(message);
        toast.add({
          title: intl.formatMessage({
            id: 'toast.shares.createFailed',
            defaultMessage: 'Failed to create share link',
          }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  function handleRevoke(shareId: string) {
    revokeShare(shareId, {
      onSuccess: () =>
        toast.add({
          title: intl.formatMessage({ id: 'toast.shares.revoked', defaultMessage: 'Share link revoked' }),
          type: 'success',
        }),
      onError: (revokeError) => {
        const message = revokeError instanceof Error ? revokeError.message : 'toast.shares.revokeErrorFallback';
        toast.add({
          title: intl.formatMessage({
            id: 'toast.shares.revokeFailed',
            defaultMessage: 'Failed to revoke share link',
          }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
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
    isFetchingShares,
    page,
    totalPages,
    pageItems,
    canGoPrevious,
    canGoNext,
    goToPage,
    goToPreviousPage,
    goToNextPage,
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
