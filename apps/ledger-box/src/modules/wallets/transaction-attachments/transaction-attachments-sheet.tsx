import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@vhnam/ui/components/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@vhnam/ui/components/sheet';
import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

import { TransactionAttachmentEmptyState } from './transaction-attachment-empty-state';
import { TransactionAttachmentHeader } from './transaction-attachment-header';
import { TransactionAttachmentList } from './transaction-attachment-list';
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
  attachments: ReturnType<typeof useTransactionAttachments>['attachments'];
  fileInputRef: ReturnType<typeof useTransactionAttachments>['fileInputRef'];
  handleUploadClick: ReturnType<typeof useTransactionAttachments>['handleUploadClick'];
  handleFileChange: ReturnType<typeof useTransactionAttachments>['handleFileChange'];
  handlePreviewAttachment: ReturnType<typeof useTransactionAttachments>['handlePreviewAttachment'];
  handleRemoveAttachment: ReturnType<typeof useTransactionAttachments>['handleRemoveAttachment'];
};

function TransactionAttachmentsContent({
  transaction,
  onBack,
  attachments,
  fileInputRef,
  handleUploadClick,
  handleFileChange,
  handlePreviewAttachment,
  handleRemoveAttachment,
}: TransactionAttachmentsContentProps) {
  return (
    <>
      <TransactionAttachmentHeader transaction={transaction} onBack={onBack} />

      {attachments.length === 0 ? (
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
    previewOpen,
    setPreviewOpen,
    previewAttachmentId,
    previewableAttachments,
    handleUploadClick,
    handleFileChange,
    handleRemoveAttachment,
    handlePreviewAttachment,
  } = useTransactionAttachments({ open });

  function handleBack() {
    onBack?.();
    onOpenChange(false);
  }

  const content = (
    <TransactionAttachmentsContent
      transaction={transaction}
      onBack={onBack ? handleBack : undefined}
      attachments={attachments}
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
          <DialogContent className="flex max-h-[min(90dvh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
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
    </>
  );
}

export { TransactionAttachmentsSheet };
