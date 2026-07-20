export type TransactionAttachmentDto = {
  id: string;
  key: string;
  url?: string;
  fileName: string;
  contentType: string;
  size: number;
};

export type UploadTransactionAttachmentsDto = {
  attachments: TransactionAttachmentDto[];
};
