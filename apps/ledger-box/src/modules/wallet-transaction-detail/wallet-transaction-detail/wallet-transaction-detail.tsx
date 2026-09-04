import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { Button } from '@vhnam/ui/components/ui/button';
import { Card, CardHeader, CardTitle } from '@vhnam/ui/components/ui/card';
import { cn } from '@vhnam/ui/lib/cn';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { format, toDate } from '@vhnam/utils/date';

import { getTransactionAmountClassName } from '#/utils/transaction/transaction-amount';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useWallets } from '#/queries/wallets/wallet.queries';

import { DeleteTransactionAttachmentDialog } from '#/modules/wallet-transaction-detail/wallet-delete-transaction-attachment-dialog';
import {
  TransactionAttachmentEmptyState,
  TransactionAttachmentList,
  TransactionAttachmentLoadingState,
  TransactionAttachmentPreview,
  TransactionAttachmentUpload,
  useTransactionAttachments,
} from '#/modules/wallet-transaction-detail/wallet-transaction-attachments';
import { DeleteTransactionDialog } from '#/modules/wallet-transactions/wallet-delete-transaction-dialog';
import { EditTransactionDialog } from '#/modules/wallet-transactions/wallet-edit-transaction-dialog';

import { useWalletTransactionDetail } from './wallet-transaction-detail.actions';

type WalletTransactionDetailProps = {
  transaction: TransactionDto;
};

type DetailStatTileProps = {
  icon: IconName;
  label: ReactNode;
  value: ReactNode;
};

function TransactionDetailDateTime({ date }: { date: string }) {
  const occurredAt = toDate(date);

  return (
    <time dateTime={date}>
      <span className="block lg:inline">{format(occurredAt, 'MMM d, yyyy')}</span>
      <span className="hidden lg:inline"> • </span>
      <span className="block lg:inline">{format(occurredAt, 'h:mm a')}</span>
    </time>
  );
}

function DetailStatTile({ icon, label, value }: DetailStatTileProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 md:p-4">
      <div className="size-10 items-center justify-center rounded-lg bg-muted hidden md:flex">
        <Icon name={icon} className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-semibold leading-tight', typeof value === 'string' && 'truncate')}>{value}</p>
      </div>
    </div>
  );
}

function WalletTransactionDetail({ transaction }: WalletTransactionDetailProps) {
  const intl = useIntl();
  const { data: wallets = [] } = useWallets();
  const wallet = wallets.find((item) => item.id === transaction.walletId);
  const isExpense = transaction.type === 'expense';
  const { editOpen, setEditOpen, deleteOpen, setDeleteOpen, handleDeleted } = useWalletTransactionDetail(transaction);
  const {
    fileInputRef,
    attachments,
    isLoading,
    isError,
    error,
    isUploading,
    previewOpen,
    setPreviewOpen,
    previewAttachmentId,
    previewableAttachments,
    handleUploadClick,
    handleFileChange,
    handleRemoveAttachment,
    handleRemoveAttachmentDialogOpenChange,
    handlePreviewAttachment,
    attachmentToRemove,
    removePendingAttachment,
  } = useTransactionAttachments({
    open: true,
    walletId: transaction.walletId,
    transactionId: transaction.id,
  });

  return (
    <>
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <Link
          to="/wallets/$walletId"
          params={{ walletId: transaction.walletId }}
          className="-ml-2 inline-flex w-fit items-center gap-1.5 rounded-md py-2 pr-2 pl-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="ArrowLeftIcon" className="size-4" />
          <FormattedMessage id="transaction.detail.backToTransactions" defaultMessage="Back to transactions" />
        </Link>

        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full',
                  isExpense ? 'bg-rose-500' : 'bg-emerald-500',
                )}
              >
                <Icon name={isExpense ? 'ArrowDownIcon' : 'ArrowUpIcon'} className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={cn(getTransactionAmountClassName(transaction.type, 'xl'))}>
                  {formatSignedCurrency(transaction.amount, transaction.type, {
                    notation: 'standard',
                    currency: wallet?.currency ?? 'VND',
                  })}
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setEditOpen(true)}
                aria-label={intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
              >
                <Icon name="PencilLineIcon" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={() => setDeleteOpen(true)}
                aria-label={intl.formatMessage({ id: 'common.delete', defaultMessage: 'Delete' })}
              >
                <Icon name="TrashIcon" />
              </Button>
            </div>
          </div>

          <p className="mt-4 px-4 pb-6 sm:px-6 text-base leading-snug font-medium tracking-wide">
            {transaction.description}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <DetailStatTile
            icon="CalendarBlankIcon"
            label={<FormattedMessage id="transaction.detail.dateTime" defaultMessage="Date & Time" />}
            value={<TransactionDetailDateTime date={transaction.occurredAt} />}
          />
          <DetailStatTile
            icon="WalletIcon"
            label={<FormattedMessage id="transaction.detail.wallet" defaultMessage="Wallet" />}
            value={wallet?.name ?? '-'}
          />
        </div>

        <Card className="gap-0 overflow-hidden p-0">
          <CardHeader className="border-b py-4">
            <CardTitle>
              <FormattedMessage id="transaction.detail.attachments" defaultMessage="Attachments" />
            </CardTitle>
          </CardHeader>

          {isLoading ? (
            <TransactionAttachmentLoadingState />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <p className="text-sm font-medium">
                <FormattedMessage id="attachment.loadFailed" defaultMessage="Failed to load attachments" />
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                {error instanceof Error ? (
                  formatErrorMessage(intl, error.message)
                ) : (
                  <FormattedMessage id="common.pleaseTryAgain" defaultMessage="Please try again." />
                )}
              </p>
            </div>
          ) : attachments.length === 0 ? (
            <TransactionAttachmentEmptyState />
          ) : (
            <TransactionAttachmentList
              attachments={attachments}
              onPreview={handlePreviewAttachment}
              onRemove={handleRemoveAttachment}
            />
          )}

          <TransactionAttachmentUpload
            fileInputRef={fileInputRef}
            isUploading={isUploading}
            onUploadClick={handleUploadClick}
            onFileChange={handleFileChange}
          />
        </Card>

        {/* Desktop actions live in the hero card header; mobile gets a thumb-reachable sticky bar below. */}
        <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t bg-background/95 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur sm:hidden">
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setEditOpen(true)}>
            <Icon name="PencilLineIcon" />
            <FormattedMessage id="common.edit" defaultMessage="Edit" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Icon name="TrashIcon" />
            <FormattedMessage id="common.delete" defaultMessage="Delete" />
          </Button>
        </div>
      </div>

      <EditTransactionDialog open={editOpen} onOpenChange={setEditOpen} transaction={transaction} />
      <DeleteTransactionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        transaction={transaction}
        onDeleted={handleDeleted}
      />

      <TransactionAttachmentPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        attachments={previewableAttachments}
        initialAttachmentId={previewAttachmentId}
      />

      <DeleteTransactionAttachmentDialog
        open={attachmentToRemove !== null}
        onOpenChange={handleRemoveAttachmentDialogOpenChange}
        attachment={attachmentToRemove}
        walletId={transaction.walletId}
        transactionId={transaction.id}
        onRemovePending={removePendingAttachment}
      />
    </>
  );
}

export { WalletTransactionDetail };
