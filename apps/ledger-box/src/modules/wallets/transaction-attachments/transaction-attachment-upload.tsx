import type { ChangeEvent, RefObject } from 'react';

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
};

function TransactionAttachmentUpload({ fileInputRef, onUploadClick, onFileChange }: TransactionAttachmentUploadProps) {
  return (
    <div className="border-t p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_ATTACHMENT_TYPES}
        multiple
        className="sr-only"
        onChange={onFileChange}
      />
      <Attachment state="idle" className="w-full min-w-0 flex-col items-center gap-2 px-4 py-6">
        <AttachmentMedia className="size-10 bg-transparent [&_svg]:size-5!">
          <Icon name="UploadSimpleIcon" className="text-muted-foreground" />
        </AttachmentMedia>
        <AttachmentContent className="text-center">
          <AttachmentTitle>Upload files</AttachmentTitle>
          <AttachmentDescription className="whitespace-normal">
            PDF, PNG, JPG, WEBP · multiple files supported
          </AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger aria-label="Upload files" onClick={onUploadClick} />
      </Attachment>
    </div>
  );
}

export { TransactionAttachmentUpload };
