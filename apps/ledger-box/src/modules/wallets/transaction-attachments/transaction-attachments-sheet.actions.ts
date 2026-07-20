import { useEffect, useMemo, useRef, useState } from 'react';

import { toast } from '@vhnam/ui/components/sonner';

import { isPreviewableContentType, isPreviewableFile } from '#/lib/file';
import { optimizeImageForUpload } from '#/lib/image';
import type { TransactionAttachmentDto } from '#/queries/transactions/transaction-attachment.dto';
import { useUploadTransactionAttachment } from '#/queries/transactions/transaction.mutations';
import { useTransactionAttachments as useTransactionAttachmentsQuery } from '#/queries/transactions/transaction.queries';

export type TransactionAttachmentStatus = 'processing' | 'uploading' | 'error' | 'done';

export type TransactionAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  status: TransactionAttachmentStatus;
  url?: string;
  previewUrl?: string;
  error?: string;
  isRemote?: boolean;
  file?: File;
};

type PreviewableTransactionAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  previewUrl: string;
};

type UseTransactionAttachmentsOptions = {
  open: boolean;
  walletId: string;
  transactionId: string;
};

function createPendingAttachment(file: File): TransactionAttachment {
  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    file,
    previewUrl: isPreviewableFile(file) ? URL.createObjectURL(file) : undefined,
    status: 'processing',
  };
}

function mapRemoteAttachment(attachment: TransactionAttachmentDto): TransactionAttachment {
  const previewUrl = attachment.url && isPreviewableContentType(attachment.contentType) ? attachment.url : undefined;

  return {
    id: attachment.id,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    size: attachment.size,
    url: attachment.url,
    previewUrl,
    status: 'done',
    isRemote: true,
  };
}

export function useTransactionAttachments({ open, walletId, transactionId }: UseTransactionAttachmentsOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<TransactionAttachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<TransactionAttachment[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string>();
  const [attachmentToRemove, setAttachmentToRemove] = useState<TransactionAttachment | null>(null);
  const { mutate: uploadAttachment } = useUploadTransactionAttachment();
  const { data, isLoading, isError, error } = useTransactionAttachmentsQuery(walletId, transactionId, open);

  const remoteAttachments = useMemo(
    () => (data?.attachments ?? []).map((attachment) => mapRemoteAttachment(attachment)),
    [data?.attachments],
  );

  const attachments = useMemo(
    () => [...remoteAttachments, ...pendingAttachments],
    [remoteAttachments, pendingAttachments],
  );

  const previewableAttachments: PreviewableTransactionAttachment[] = attachments.flatMap((attachment) =>
    attachment.previewUrl
      ? [
          {
            id: attachment.id,
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            previewUrl: attachment.previewUrl,
          },
        ]
      : [],
  );

  const isUploading = pendingAttachments.some(
    (attachment) => attachment.status === 'processing' || attachment.status === 'uploading',
  );

  attachmentsRef.current = attachments;

  useEffect(() => {
    return () => {
      for (const attachment of attachmentsRef.current) {
        if (attachment.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setPreviewOpen(false);
      setPreviewAttachmentId(undefined);
      setPendingAttachments([]);
      setAttachmentToRemove(null);
    }
  }, [open]);

  function updatePendingAttachment(attachmentId: string, update: Partial<TransactionAttachment>) {
    setPendingAttachments((currentAttachments) =>
      currentAttachments.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, ...update } : attachment,
      ),
    );
  }

  function removePendingAttachment(attachmentId: string) {
    setPendingAttachments((currentAttachments) => {
      const attachment = currentAttachments.find((item) => item.id === attachmentId);

      if (attachment?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return currentAttachments.filter((item) => item.id !== attachmentId);
    });
  }

  function uploadFile(attachment: TransactionAttachment) {
    if (!attachment.file) {
      return;
    }

    uploadAttachment(
      {
        walletId,
        transactionId,
        file: attachment.file,
      },
      {
        onSuccess: () => {
          removePendingAttachment(attachment.id);
        },
        onError: (uploadError) => {
          const message =
            uploadError instanceof Error ? uploadError.message : 'Failed to upload attachment. Please try again.';

          updatePendingAttachment(attachment.id, {
            status: 'error',
            error: message,
          });
          toast.error('Failed to upload attachment', { description: message });
        },
      },
    );
  }

  async function processAndUploadFile(attachment: TransactionAttachment) {
    if (!attachment.file) {
      return;
    }

    const optimizedFile = await optimizeImageForUpload(attachment.file);

    if (optimizedFile !== attachment.file && attachment.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    const previewUrl =
      optimizedFile !== attachment.file && isPreviewableFile(optimizedFile)
        ? URL.createObjectURL(optimizedFile)
        : attachment.previewUrl;

    const optimizedAttachment: TransactionAttachment = {
      ...attachment,
      file: optimizedFile,
      fileName: optimizedFile.name,
      contentType: optimizedFile.type,
      size: optimizedFile.size,
      previewUrl,
      status: 'uploading',
    };

    updatePendingAttachment(attachment.id, optimizedAttachment);
    uploadFile(optimizedAttachment);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files?.length) {
      return;
    }

    const nextAttachments = Array.from(files).map((file) => createPendingAttachment(file));

    setPendingAttachments((currentAttachments) => [...currentAttachments, ...nextAttachments]);

    for (const attachment of nextAttachments) {
      void processAndUploadFile(attachment);
    }

    event.target.value = '';
  }

  function handleRemoveAttachment(attachmentId: string) {
    const attachment = attachments.find((item) => item.id === attachmentId);

    if (!attachment) {
      return;
    }

    setAttachmentToRemove(attachment);
  }

  function handleRemoveAttachmentDialogOpenChange(open: boolean) {
    if (!open) {
      setAttachmentToRemove(null);
    }
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
    isLoading,
    isError,
    error,
    isUploading,
    previewOpen,
    setPreviewOpen,
    previewAttachmentId,
    previewableAttachments,
    handleUploadClick,
    handleFileChange,
    handleRemoveAttachment,
    handleRemoveAttachmentDialogOpenChange,
    handlePreviewAttachment,
    attachmentToRemove,
    removePendingAttachment,
  };
}
