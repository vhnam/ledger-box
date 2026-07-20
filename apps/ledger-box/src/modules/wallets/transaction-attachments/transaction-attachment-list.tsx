import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@vhnam/ui/components/attachment';
import { Icon } from '@vhnam/ui/components/icon';
import { cn } from '@vhnam/ui/lib/utils';

import {
  formatFileSize,
  getAttachmentIconNameFromContentType,
  getFileTypeLabelFromName,
  isImageContentType,
} from '#/lib/file';

import type { TransactionAttachment } from './transaction-attachments-sheet.actions';

type TransactionAttachmentListProps = {
  attachments: TransactionAttachment[];
  onPreview: (attachment: TransactionAttachment) => void;
  onRemove: (attachmentId: string) => void;
};

function getAttachmentState(status: TransactionAttachment['status']) {
  if (status === 'processing') {
    return 'processing';
  }

  if (status === 'uploading') {
    return 'uploading';
  }

  if (status === 'error') {
    return 'error';
  }

  return 'done';
}

function TransactionAttachmentList({ attachments, onPreview, onRemove }: TransactionAttachmentListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
      {attachments.map((attachment) => {
        const isPreviewable = attachment.status === 'done' && Boolean(attachment.previewUrl);

        return (
          <Attachment
            key={attachment.id}
            state={getAttachmentState(attachment.status)}
            className={cn('w-full min-w-0', isPreviewable && 'cursor-pointer')}
          >
            <AttachmentMedia
              variant={attachment.previewUrl && isImageContentType(attachment.contentType) ? 'image' : 'icon'}
              className="size-12"
            >
              {attachment.previewUrl && isImageContentType(attachment.contentType) ? (
                <img src={attachment.previewUrl} alt={attachment.fileName} />
              ) : (
                <Icon name={getAttachmentIconNameFromContentType(attachment.contentType)} className="size-5" />
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{attachment.fileName}</AttachmentTitle>
              <AttachmentDescription>
                {attachment.status === 'error'
                  ? (attachment.error ?? 'Upload failed')
                  : attachment.status === 'processing'
                    ? 'Optimizing...'
                    : `${getFileTypeLabelFromName(attachment.fileName, attachment.contentType)} · ${formatFileSize(attachment.size)}`}
              </AttachmentDescription>
            </AttachmentContent>
            {isPreviewable ? (
              <AttachmentTrigger aria-label={`View ${attachment.fileName}`} onClick={() => onPreview(attachment)} />
            ) : null}
            <AttachmentActions>
              {attachment.status !== 'processing' && attachment.status !== 'uploading' ? (
                <AttachmentAction aria-label={`Remove ${attachment.fileName}`} onClick={() => onRemove(attachment.id)}>
                  <Icon name="TrashIcon" />
                </AttachmentAction>
              ) : null}
            </AttachmentActions>
          </Attachment>
        );
      })}
    </div>
  );
}

export { TransactionAttachmentList };
