import type { ChangeEvent, RefObject } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@vhnam/ui/components/attachment';
import { Icon } from '@vhnam/ui/components/icon';

const ACCEPTED_ATTACHMENT_TYPES = '.pdf,.png,.jpg,.jpeg,.webp';

type TransactionAttachmentUploadProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUploadClick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
};

function TransactionAttachmentUpload({
  fileInputRef,
  onUploadClick,
  onFileChange,
  isUploading = false,
}: TransactionAttachmentUploadProps) {
  const intl = useIntl();

  return (
    <div className="border-t p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_ATTACHMENT_TYPES}
        multiple
        disabled={isUploading}
        className="sr-only"
        onChange={onFileChange}
      />
      <Attachment
        state={isUploading ? 'uploading' : 'idle'}
        className="w-full min-w-0 flex-col items-center gap-2 px-4 py-6"
      >
        <AttachmentMedia className="size-10 bg-transparent [&_svg]:size-5!">
          <Icon name="UploadSimpleIcon" className="text-muted-foreground" />
        </AttachmentMedia>
        <AttachmentContent className="text-center">
          <AttachmentTitle>
            {isUploading ? (
              <FormattedMessage id="attachment.upload.uploading" defaultMessage="Uploading files..." />
            ) : (
              <FormattedMessage id="attachment.upload.title" defaultMessage="Upload files" />
            )}
          </AttachmentTitle>
          <AttachmentDescription className="whitespace-normal">
            <FormattedMessage
              id="attachment.upload.hint"
              defaultMessage="PDF, PNG, JPG, WEBP · multiple files supported"
            />
          </AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger
          aria-label={intl.formatMessage({ id: 'attachment.upload.ariaLabel', defaultMessage: 'Upload files' })}
          disabled={isUploading}
          onClick={onUploadClick}
        />
      </Attachment>
    </div>
  );
}

export { TransactionAttachmentUpload };
