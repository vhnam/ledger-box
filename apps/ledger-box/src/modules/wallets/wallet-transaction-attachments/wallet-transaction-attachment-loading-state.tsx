import { Icon } from '@vhnam/ui/components/icon';

function TransactionAttachmentLoadingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <Icon name="CircleNotchIcon" className="size-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">Loading attachments...</p>
    </div>
  );
}

export { TransactionAttachmentLoadingState };
