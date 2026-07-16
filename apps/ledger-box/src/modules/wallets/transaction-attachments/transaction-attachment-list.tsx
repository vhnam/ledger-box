import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@vhnam/ui/components/attachment';
import { Icon } from '@vhnam/ui/components/icon';

import { formatFileSize, getAttachmentIconName, getFileTypeLabel } from '#/lib/file';

import type { TransactionAttachment } from './transaction-attachments-sheet.actions';

type TransactionAttachmentListProps = {
  attachments: TransactionAttachment[];
  onPreview: (attachment: TransactionAttachment) => void;
  onRemove: (attachmentId: string) => void;
};

function TransactionAttachmentList({ attachments, onPreview, onRemove }: TransactionAttachmentListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
      {attachments.map((attachment) => (
        <Attachment key={attachment.id} state="done" className="w-full min-w-0">
          <AttachmentMedia variant={attachment.previewUrl ? 'image' : 'icon'} className="size-12">
            {attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt={attachment.file.name} />
            ) : (
              <Icon name={getAttachmentIconName(attachment.file)} className="size-5" />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{attachment.file.name}</AttachmentTitle>
            <AttachmentDescription>
              {getFileTypeLabel(attachment.file)} · {formatFileSize(attachment.file.size)}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={`View ${attachment.file.name}`} onClick={() => onPreview(attachment)}>
              <Icon name="EyeIcon" />
            </AttachmentAction>
            <AttachmentAction aria-label={`Remove ${attachment.file.name}`} onClick={() => onRemove(attachment.id)}>
              <Icon name="TrashIcon" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </div>
  );
}

export { TransactionAttachmentList };
