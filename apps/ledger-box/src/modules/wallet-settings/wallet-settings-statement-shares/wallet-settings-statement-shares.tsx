import { useState } from 'react';

import { Button } from '@vhnam/ui/components/button';
import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@vhnam/ui/components/dialog';
import { Field, FieldError, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Input } from '@vhnam/ui/components/input';
import { Separator } from '@vhnam/ui/components/separator';
import { Spinner } from '@vhnam/ui/components/spinner';
import { toast } from '@vhnam/ui/components/toast';

import { format } from '@vhnam/utils/date';

import { AppPagination } from '#/components/app-pagination';
import { StatementSnapshotView } from '#/modules/statement/statement-snapshot-view';
import { useWalletSettingsStatementSharesActions } from '#/modules/wallet-settings/wallet-settings-statement-shares/wallet-settings-statement-shares.actions';
import { WalletStatementShareRow } from '#/modules/wallet-settings/wallet-settings-statement-shares/wallet-statement-share-row';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

type WalletSettingsStatementSharesProps = {
  wallet: WalletDto;
};

function WalletSettingsStatementShares({ wallet }: WalletSettingsStatementSharesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    shares,
    isLoadingShares,
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
  } = useWalletSettingsStatementSharesActions({ wallet });

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      resetCreateFlow();
    }
  }

  function handleCopyLink() {
    if (!createdLink) {
      return;
    }

    const url = `${window.location.origin}${createdLink.publicUrl}`;
    void navigator.clipboard.writeText(url);
    toast.add({ title: 'Link copied to clipboard', type: 'success' });
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold">Statement links</h1>
          <p className="text-sm text-muted-foreground">
            Share a read-only, revocable statement for a date range, without sign-in.
          </p>
        </div>

        <Button variant="secondary" className="w-fit" onClick={() => setDialogOpen(true)}>
          <Icon name="ShareIcon" />
          Share statement
        </Button>

        {isLoadingShares ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : (
          shares.length > 0 && (
            <>
              <Separator />
              <ul className="divide-y divide-border">
                {shares.map((share) => (
                  <WalletStatementShareRow key={share.id} walletId={wallet.id} share={share} onRevoke={handleRevoke} />
                ))}
              </ul>
              {totalPages > 1 ? (
                <AppPagination
                  page={page}
                  totalPages={totalPages}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  pageItems={pageItems}
                  goToPage={goToPage}
                  goToPreviousPage={goToPreviousPage}
                  goToNextPage={goToNextPage}
                />
              ) : null}
            </>
          )
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Share statement</DialogTitle>
          </DialogHeader>

          {createdLink ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Copy this link now — it will not be shown again. Anyone with this link can view the statement until it
                expires or is revoked.
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={`${window.location.origin}${createdLink.publicUrl}`} />
                <Button variant="outline" onClick={handleCopyLink}>
                  <Icon name="CopyIcon" />
                  Copy
                </Button>
              </div>
              <Button onClick={() => handleDialogOpenChange(false)}>Done</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Period</FieldLabel>
                <DatePickerRange
                  value={periodFrom && periodTo ? { from: new Date(periodFrom), to: new Date(periodTo) } : undefined}
                  onChange={(range) => {
                    setPeriodFrom(range?.from ? format(range.from, 'yyyy-MM-dd') : undefined);
                    setPeriodTo(range?.to ? format(range.to, 'yyyy-MM-dd') : undefined);
                  }}
                  numberOfMonths={1}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="display-title">Display title (optional)</FieldLabel>
                <Input
                  id="display-title"
                  value={displayTitle}
                  onChange={(event) => setDisplayTitle(event.target.value)}
                  placeholder="e.g. March holding"
                  maxLength={80}
                />
              </Field>

              {error ? <FieldError>{error}</FieldError> : null}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handlePreview} disabled={isPreviewing}>
                  {isPreviewing && <Spinner className="size-4" />}
                  Preview
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleDownloadCsv} disabled={isDownloading}>
                  {isDownloading && <Spinner className="size-4" />}
                  <Icon name="DownloadIcon" />
                  Download CSV
                </Button>
                <Button className="flex-1" onClick={handleCreate} disabled={isCreating}>
                  {isCreating && <Spinner className="size-4" />}
                  Create link
                </Button>
              </div>

              {previewSnapshot ? (
                <div className="max-h-96 overflow-y-auto rounded-lg border p-4">
                  <StatementSnapshotView snapshot={previewSnapshot} />
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { WalletSettingsStatementShares };
