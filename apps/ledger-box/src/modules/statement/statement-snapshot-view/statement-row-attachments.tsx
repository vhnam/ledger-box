import { useIntl } from 'react-intl';

import { Icon } from '@vhnam/ui/components/icon';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@vhnam/ui/components/ui/attachment';

import { formatFileSize, getAttachmentIconNameFromContentType, isImageContentType } from '#/utils/attachments/file';

import type { StatementAttachmentDto } from '#/queries/statement-shares/statement-share.dto';

type StatementRowAttachmentsProps = {
  attachments: StatementAttachmentDto[] | undefined;
  onPreview: (attachments: StatementAttachmentDto[], attachmentId: string) => void;
};

function StatementRowAttachments({ attachments, onPreview }: StatementRowAttachmentsProps) {
  const intl = useIntl();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <AttachmentGroup className="mt-1.5 flex-col gap-2">
      {attachments.map((attachment) => {
        const isImage = isImageContentType(attachment.contentType);

        return (
          <Attachment key={attachment.id} size="sm" className="w-full cursor-pointer">
            <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
              {isImage ? (
                <img src={attachment.url} alt={attachment.fileName} />
              ) : (
                <Icon name={getAttachmentIconNameFromContentType(attachment.contentType)} />
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{attachment.fileName}</AttachmentTitle>
              <AttachmentDescription>{formatFileSize(attachment.size)}</AttachmentDescription>
            </AttachmentContent>
            <AttachmentTrigger
              aria-label={intl.formatMessage(
                { id: 'attachment.viewAria', defaultMessage: 'View {fileName}' },
                { fileName: attachment.fileName },
              )}
              onClick={() => onPreview(attachments, attachment.id)}
            />
          </Attachment>
        );
      })}
    </AttachmentGroup>
  );
}

export { StatementRowAttachments };
export type { StatementRowAttachmentsProps };
