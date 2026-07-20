import { useEffect, useState } from 'react';

import { Button } from '@vhnam/ui/components/button';
import { Dialog, DialogContent } from '@vhnam/ui/components/dialog';
import { Icon } from '@vhnam/ui/components/icon';
import { cn } from '@vhnam/ui/lib/utils';

import { isPdfContentType } from '#/lib/file';

type PreviewableTransactionAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  previewUrl: string;
};

type TransactionAttachmentPreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: PreviewableTransactionAttachment[];
  initialAttachmentId?: string;
};

function TransactionAttachmentPreview({
  open,
  onOpenChange,
  attachments,
  initialAttachmentId,
}: TransactionAttachmentPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextIndex = initialAttachmentId
      ? attachments.findIndex((attachment) => attachment.id === initialAttachmentId)
      : 0;

    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [open, initialAttachmentId, attachments]);

  const activeAttachment = attachments[activeIndex];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < attachments.length - 1;

  function handleOpenInNewTab() {
    if (!activeAttachment) {
      return;
    }

    window.open(activeAttachment.previewUrl, '_blank', 'noopener,noreferrer');
  }

  if (!activeAttachment) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[60] bg-black"
        className={cn(
          'fixed inset-0 top-0 left-0 z-[60] flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-black p-0 text-white ring-0 sm:max-w-none',
          'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        )}
      >
        <div className="relative z-10 flex shrink-0 items-center gap-3 px-4 py-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{activeAttachment.fileName}</p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={handleOpenInNewTab}
            >
              <Icon name="ArrowSquareOutIcon" />
              <span className="sr-only">Open in new tab</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <Icon name="XIcon" />
              <span className="sr-only">Close preview</span>
            </Button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 flex items-center justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
            {isPdfContentType(activeAttachment.contentType) ? (
              <iframe
                src={activeAttachment.previewUrl}
                title={activeAttachment.fileName}
                className="h-full w-full border-0 bg-black"
              />
            ) : (
              <img
                src={activeAttachment.previewUrl}
                alt={activeAttachment.fileName}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>

          {hasPrevious ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 left-3 z-10 h-16 w-8 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setActiveIndex((index) => index - 1)}
            >
              <Icon name="CaretLeftIcon" className="size-5" />
              <span className="sr-only">Previous attachment</span>
            </Button>
          ) : null}

          {hasNext ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-3 z-10 h-16 w-8 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setActiveIndex((index) => index + 1)}
            >
              <Icon name="CaretRightIcon" className="size-5" />
              <span className="sr-only">Next attachment</span>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { TransactionAttachmentPreview };
