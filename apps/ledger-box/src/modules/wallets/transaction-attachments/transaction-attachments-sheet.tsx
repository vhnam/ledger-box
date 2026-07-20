import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@vhnam/ui/components/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@vhnam/ui/components/sheet';
import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

import { DeleteTransactionAttachmentDialog } from '../delete-transaction-attachment-dialog';
import { TransactionDialogHeader } from '../wallet-transactions/wallet-transaction-dialog-header';
import { TransactionAttachmentEmptyState } from './transaction-attachment-empty-state';
import { TransactionAttachmentList } from './transaction-attachment-list';
import { TransactionAttachmentLoadingState } from './transaction-attachment-loading-state';
import { TransactionAttachmentPreview } from './transaction-attachment-preview';
import { TransactionAttachmentUpload } from './transaction-attachment-upload';
import { useTransactionAttachments } from './transaction-attachments-sheet.actions';

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
  return (
    <>
      <TransactionDialogHeader transaction={transaction} onBack={onBack} onClose={onClose} bordered />

      {isLoading ? (
        <TransactionAttachmentLoadingState />
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <p className="text-sm font-medium">Failed to load attachments</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Please try again.'}
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
  const isMobile = useIsMobile();
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
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-2xl px-0 pb-0 pt-2"
          >
            <SheetTitle className="sr-only">Transaction attachments</SheetTitle>
            <SheetDescription className="sr-only">Attachments for {transaction.description}</SheetDescription>
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="flex max-h-[min(90dvh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
          >
            <DialogTitle className="sr-only">Transaction attachments</DialogTitle>
            <DialogDescription className="sr-only">Attachments for {transaction.description}</DialogDescription>
            {content}
          </DialogContent>
        </Dialog>
      )}

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
