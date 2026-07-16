import { useEffect, useRef, useState } from 'react';

import { isPreviewableFile } from '#/lib/file';

export type TransactionAttachment = {
  id: string;
  file: File;
  previewUrl?: string;
};

type PreviewableTransactionAttachment = {
  id: string;
  file: File;
  previewUrl: string;
};

type UseTransactionAttachmentsOptions = {
  open: boolean;
};

function createTransactionAttachment(file: File): TransactionAttachment {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: isPreviewableFile(file) ? URL.createObjectURL(file) : undefined,
  };
}

export function useTransactionAttachments({ open }: UseTransactionAttachmentsOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<TransactionAttachment[]>([]);
  const [attachments, setAttachments] = useState<TransactionAttachment[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string>();

  const previewableAttachments: PreviewableTransactionAttachment[] = attachments.flatMap((attachment) =>
    attachment.previewUrl ? [{ id: attachment.id, file: attachment.file, previewUrl: attachment.previewUrl }] : [],
  );

  attachmentsRef.current = attachments;

  useEffect(() => {
    return () => {
      for (const attachment of attachmentsRef.current) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setPreviewOpen(false);
      setPreviewAttachmentId(undefined);
    }
  }, [open]);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files?.length) {
      return;
    }

    setAttachments((currentAttachments) => [
      ...currentAttachments,
      ...Array.from(files).map((file) => createTransactionAttachment(file)),
    ]);
    event.target.value = '';
  }

  function handleRemoveAttachment(attachmentId: string) {
    setAttachments((currentAttachments) => {
      const attachment = currentAttachments.find((item) => item.id === attachmentId);

      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return currentAttachments.filter((item) => item.id !== attachmentId);
    });
  }

  function handlePreviewAttachment(attachment: TransactionAttachment) {
    if (!attachment.previewUrl) {
      return;
    }

    setPreviewAttachmentId(attachment.id);
    setPreviewOpen(true);
  }

  return {
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
  };
}
