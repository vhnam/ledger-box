import { Icon } from '@vhnam/ui/components/icon';

function TransactionAttachmentEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon name="PaperclipIcon" className="size-6 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">No attachments yet.</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">Upload receipts, invoices, or any PDF / image.</p>
    </div>
  );
}

export { TransactionAttachmentEmptyState };
