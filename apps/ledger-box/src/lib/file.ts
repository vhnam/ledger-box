import type { IconName } from '@vhnam/ui/components/icon';

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

export function isPdfFile(file: File) {
  return file.type === 'application/pdf';
}

export function isPdfContentType(contentType: string) {
  return contentType === 'application/pdf';
}

export function isImageContentType(contentType: string) {
  return contentType.startsWith('image/');
}

export function isPreviewableContentType(contentType: string) {
  return isImageContentType(contentType) || isPdfContentType(contentType);
}

export function isPreviewableFile(file: File) {
  return isImageFile(file) || isPdfFile(file);
}

export function getFileTypeLabelFromName(fileName: string, contentType?: string) {
  if (contentType && isPdfContentType(contentType)) {
    return 'PDF';
  }

  const extension = fileName.split('.').pop()?.toUpperCase();

  if (extension) {
    return extension === 'JPG' ? 'JPEG' : extension;
  }

  return 'FILE';
}

export function getFileTypeLabel(file: File) {
  return getFileTypeLabelFromName(file.name, file.type);
}

export function getAttachmentIconNameFromContentType(contentType: string): IconName {
  if (isPdfContentType(contentType)) {
    return 'FilePdfIcon';
  }

  if (isImageContentType(contentType)) {
    return 'FileImageIcon';
  }

  return 'FileIcon';
}

export function getAttachmentIconName(file: File): IconName {
  return getAttachmentIconNameFromContentType(file.type);
}
