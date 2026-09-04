import { useIntl, type IntlShape } from 'react-intl';

import { Icon } from '@vhnam/ui/components/icon';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@vhnam/ui/components/ui/attachment';
import { cn } from '@vhnam/ui/lib/cn';

import {
  formatFileSize,
  getAttachmentIconNameFromContentType,
  getFileTypeLabelFromName,
  isImageContentType,
} from '#/utils/attachments/file';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import type { TransactionAttachment } from '#/modules/wallet-transaction-detail/wallet-transaction-attachments';

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

function getAttachmentDescription(intl: IntlShape, attachment: TransactionAttachment) {
  switch (attachment.status) {
    case 'error':
      return formatErrorMessage(intl, attachment.error ?? 'attachment.status.uploadFailed');
    case 'processing':
      return intl.formatMessage({
        id: 'attachment.status.optimizing',
        defaultMessage: 'Optimizing...',
      });
    case 'uploading':
      return intl.formatMessage({
        id: 'attachment.status.uploading',
        defaultMessage: 'Uploading...',
      });
    default:
      return `${getFileTypeLabelFromName(attachment.fileName, attachment.contentType)} · ${formatFileSize(attachment.size)}`;
  }
}

function TransactionAttachmentList({ attachments, onPreview, onRemove }: TransactionAttachmentListProps) {
  const intl = useIntl();

  return (
    <AttachmentGroup className="p-4 flex flex-col gap-4">
      {attachments.map((attachment) => {
        const isPreviewable = attachment.status === 'done' && Boolean(attachment.previewUrl);

        return (
          <Attachment
            key={attachment.id}
            state={getAttachmentState(attachment.status)}
            className={cn('w-full', isPreviewable && 'cursor-pointer')}
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
              <AttachmentDescription>{getAttachmentDescription(intl, attachment)}</AttachmentDescription>
            </AttachmentContent>
            {isPreviewable ? (
              <AttachmentTrigger
                aria-label={intl.formatMessage(
                  { id: 'attachment.viewAria', defaultMessage: 'View {fileName}' },
                  { fileName: attachment.fileName },
                )}
                onClick={() => onPreview(attachment)}
              />
            ) : null}
            <AttachmentActions>
              {attachment.status !== 'processing' && attachment.status !== 'uploading' ? (
                <AttachmentAction
                  aria-label={intl.formatMessage(
                    { id: 'attachment.removeAria', defaultMessage: 'Remove {fileName}' },
                    { fileName: attachment.fileName },
                  )}
                  onClick={() => onRemove(attachment.id)}
                >
                  <Icon name="TrashIcon" />
                </AttachmentAction>
              ) : null}
            </AttachmentActions>
          </Attachment>
        );
      })}
    </AttachmentGroup>
  );
}

export { TransactionAttachmentList };
