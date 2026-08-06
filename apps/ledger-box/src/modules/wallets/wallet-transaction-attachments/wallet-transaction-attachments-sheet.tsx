import { FormattedMessage, useIntl } from 'react-intl';

import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';

import { formatErrorMessage } from '#/lib/intl-message';
import { DeleteTransactionAttachmentDialog } from '#/modules/wallets/wallet-delete-transaction-attachment-dialog';
import { TransactionAttachmentEmptyState } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachment-empty-state';
import { TransactionAttachmentList } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachment-list';
import { TransactionAttachmentLoadingState } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachment-loading-state';
import { TransactionAttachmentPreview } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachment-preview';
import { TransactionAttachmentUpload } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachment-upload';
import { useTransactionAttachments } from '#/modules/wallets/wallet-transaction-attachments/wallet-transaction-attachments-sheet.actions';
import { TransactionDialogHeader } from '#/modules/wallets/wallet-transactions/wallet-transaction-dialog-header';
import type { TransactionDto } from '#/queries/transactions/transaction.dto';

type TransactionAttachmentsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDto;
  onBack?: () => void;
};

type TransactionAttachmentsContentProps = {
  transaction: TransactionDto;
  onBack?: () => void;
  onClose: () => void;
  attachments: ReturnType<typeof useTransactionAttachments>['attachments'];
  isLoading: ReturnType<typeof useTransactionAttachments>['isLoading'];
  isError: ReturnType<typeof useTransactionAttachments>['isError'];
  error: ReturnType<typeof useTransactionAttachments>['error'];
  isUploading: ReturnType<typeof useTransactionAttachments>['isUploading'];
  fileInputRef: ReturnType<typeof useTransactionAttachments>['fileInputRef'];
  handleUploadClick: ReturnType<typeof useTransactionAttachments>['handleUploadClick'];
  handleFileChange: ReturnType<typeof useTransactionAttachments>['handleFileChange'];
  handlePreviewAttachment: ReturnType<typeof useTransactionAttachments>['handlePreviewAttachment'];
  handleRemoveAttachment: ReturnType<typeof useTransactionAttachments>['handleRemoveAttachment'];
};

function TransactionAttachmentsContent({
  transaction,
  onBack,
  onClose,
  attachments,
  isLoading,
  isError,
  error,
  isUploading,
  fileInputRef,
  handleUploadClick,
  handleFileChange,
  handlePreviewAttachment,
  handleRemoveAttachment,
}: TransactionAttachmentsContentProps) {
  const intl = useIntl();

  return (
    <>
      <TransactionDialogHeader transaction={transaction} onBack={onBack} onClose={onClose} bordered />

      {isLoading ? (
        <TransactionAttachmentLoadingState />
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
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
    </>
  );
}

function TransactionAttachmentsSheet({ open, onOpenChange, transaction, onBack }: TransactionAttachmentsSheetProps) {
  const intl = useIntl();
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
    open,
    walletId: transaction.walletId,
    transactionId: transaction.id,
  });

  function handleBack() {
    onBack?.();
    onOpenChange(false);
  }

  const content = (
    <TransactionAttachmentsContent
      transaction={transaction}
      onBack={onBack ? handleBack : undefined}
      onClose={() => onOpenChange(false)}
      attachments={attachments}
      isLoading={isLoading}
      isError={isError}
      error={error}
      isUploading={isUploading}
      fileInputRef={fileInputRef}
      handleUploadClick={handleUploadClick}
      handleFileChange={handleFileChange}
      handlePreviewAttachment={handlePreviewAttachment}
      handleRemoveAttachment={handleRemoveAttachment}
    />
  );

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={intl.formatMessage({ id: 'attachment.sheet.title', defaultMessage: 'Transaction attachments' })}
        description={intl.formatMessage(
          { id: 'attachment.sheet.description', defaultMessage: 'Attachments for {description}' },
          { description: transaction.description },
        )}
        hideTitle
        hideDescription
        showCloseButton={false}
        headerClassName="sr-only"
        className="flex max-h-[min(92dvh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        {content}
      </ResponsiveDialog>

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

export { TransactionAttachmentsSheet };
